#!/usr/bin/env python3
"""
app.py - Flask backend for Semiprime Survival Fingerprint predictions
Loads trained assets and provides a REST API for survival predictions.
"""
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import json
import pickle
import os
from semiprime_survival_matrix import preprocess_and_engineer

APP = Flask(__name__)

# Asset file paths - can be overridden via environment variable
ASSET_PREFIX = os.environ.get('SROL_ASSET_PREFIX', 'survival_assets')
WM_PATH = ASSET_PREFIX + '_wm.json'
SCALER_PATH = ASSET_PREFIX + '_scaler.json'
LR_PATH = ASSET_PREFIX + '_logistic.pkl'

# Load assets at startup
if not os.path.exists(WM_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(LR_PATH):
    print("⚠️  Warning: Missing trained assets. Run 'python train_survival_assets.py --csv <data.csv>' to generate assets.")
    print(f"    Looking for: {WM_PATH}, {SCALER_PATH}, {LR_PATH}")
    WM = {'weights': {}, 'multipliers': {}}
    SCALER = {'scaler': {'A_N_mean': 0, 'A_N_std': 1, 'M_N_mean': 1, 'M_N_std': 1}}
    LR_MODEL = None
else:
    with open(WM_PATH, 'r') as f:
        WM = json.load(f)
    with open(SCALER_PATH, 'r') as f:
        SCALER = json.load(f)
    with open(LR_PATH, 'rb') as f:
        LR_MODEL = pickle.load(f)
    print(f"[✓] Loaded trained assets from {ASSET_PREFIX}")

WEIGHTS = WM.get('weights', {})
MULTIPLIERS = WM.get('multipliers', {})


def compute_fingerprints_for_df(df):
    """
    Compute A(N), M(N), Phi(N) for a dataframe using saved weights/multipliers and scaler params.
    
    Args:
        df: Input dataframe with passenger data
        
    Returns:
        Dataframe with computed fingerprints and predictions
    """
    df_proc = df.copy()
    # Ensure engine preprocessing same as training
    df_proc = preprocess_and_engineer(df_proc)

    # Compute A(N) - additive component
    A = np.zeros(len(df_proc))
    for col, w in WEIGHTS.items():
        if col in df_proc.columns:
            A += df_proc[col].values * float(w)
    
    # Family buckets contribution
    for b in ['Solo', 'Small', 'Medium', 'Large']:
        key = f'Family_{b}'
        if key in WEIGHTS and 'FamilyBuck' in df_proc.columns:
            mask = (df_proc['FamilyBuck'] == b).astype(int).values
            A += mask * float(WEIGHTS[key])
    
    # Age scaled contribution
    if 'Age' in df_proc.columns and df_proc['Age'].notnull().any():
        age_median = df_proc['Age'].median()
        age_log = np.log1p(df_proc['Age'].fillna(age_median))
        age_mean = age_log.mean()
        age_std = age_log.std() + 1e-9
        A += (age_log - age_mean) / age_std

    df_proc['A_N'] = A

    # Compute M(N) - multiplicative component
    M = np.ones(len(df_proc))
    for k, v in MULTIPLIERS.items():
        if k in df_proc.columns:
            M *= np.where(df_proc[k] == 1, float(v), 1.0)
    
    df_proc['M_N'] = M

    # Scale using serialized scaler moments
    A_mean = float(SCALER['scaler']['A_N_mean'])
    A_std = float(SCALER['scaler']['A_N_std'])
    M_mean = float(SCALER['scaler']['M_N_mean'])
    M_std = float(SCALER['scaler']['M_N_std'])

    df_proc['A_N_scaled'] = (df_proc['A_N'] - A_mean) / (A_std + 1e-9)
    df_proc['M_N_scaled'] = (df_proc['M_N'] - M_mean) / (M_std + 1e-9)

    df_proc['Phi_N'] = df_proc['A_N_scaled'] * df_proc['M_N_scaled']

    # Predict probability
    if LR_MODEL is not None:
        pred_prob = LR_MODEL.predict_proba(df_proc[['Phi_N']].fillna(0))[:, 1]
        df_proc['PredProb'] = pred_prob
    else:
        df_proc['PredProb'] = np.nan

    return df_proc


# Health check endpoint
@APP.route('/health', methods=['GET'])
def health():
    """Health check endpoint - returns backend status and Kaggle configuration."""
    assets_loaded = all(os.path.exists(p) for p in [WM_PATH, SCALER_PATH, LR_PATH])
    
    # Check for Kaggle credentials in environment
    kaggle_username = os.environ.get('KAGGLE_USERNAME')
    kaggle_key = os.environ.get('KAGGLE_KEY')
    kaggle_configured = bool(kaggle_username and kaggle_key)
    
    return jsonify({
        'status': 'ok',
        'assets_loaded': assets_loaded,
        'kaggleConfigured': kaggle_configured,
        'survival_model_ready': LR_MODEL is not None
    })


# Prediction endpoint
@APP.route('/predict', methods=['POST'])
def predict_survival():
    """
    Predict survival probability for passenger(s).
    
    Accepts JSON body with single passenger object or array of passenger objects.
    Returns predictions with A(N), M(N), Phi(N), and survival probability.
    """
    try:
        payload = request.get_json(force=True)
    except Exception as e:
        return jsonify({'error': f'Invalid JSON: {str(e)}'}), 400
    
    # Accept single passenger dict or list of passengers
    if isinstance(payload, dict):
        rows = [payload]
    elif isinstance(payload, list):
        rows = payload
    else:
        return jsonify({'error': 'JSON body must be an object or array of objects'}), 400

    if not rows:
        return jsonify({'error': 'No data provided'}), 400

    df_in = pd.DataFrame(rows)
    
    try:
        df_out = compute_fingerprints_for_df(df_in)
    except Exception as e:
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

    results = []
    for idx, row in df_out.iterrows():
        # Compute outlier score: signed residual = observed - predicted (if observed provided)
        observed = row.get('Survived', np.nan)
        pred = row.get('PredProb', np.nan)
        outlier_score = None
        if not np.isnan(observed) and not np.isnan(pred):
            outlier_score = float(observed) - float(pred)
        
        results.append({
            'input_index': int(idx),
            'passenger_name': row.get('Name', None),
            'Phi_N': float(row.get('Phi_N', np.nan)),
            'A_N': float(row.get('A_N', np.nan)),
            'M_N': float(row.get('M_N', np.nan)),
            'predicted_survival_probability': (None if np.isnan(pred) else float(pred)),
            'observed_survived': (None if np.isnan(observed) else int(observed)),
            'outlier_score_signed': outlier_score
        })

    return jsonify({'n': len(results), 'results': results})


# CORS support for development
@APP.after_request
def after_request(response):
    """Add CORS headers for development."""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response


if __name__ == '__main__':
    print("=" * 60)
    print("Semiprime Survival Fingerprint Backend Server")
    print("=" * 60)
    if LR_MODEL is None:
        print("\n⚠️  WARNING: No trained model loaded!")
        print("   Run: python train_survival_assets.py --csv <your_data.csv>")
        print("   to train and save model assets before using predictions.\n")
    print("Starting Flask server on http://0.0.0.0:5000")
    print("Health check: http://localhost:5000/health")
    print("=" * 60)
    APP.run(host='0.0.0.0', port=5000, debug=True)
