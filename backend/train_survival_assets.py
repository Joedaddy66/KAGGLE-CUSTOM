#!/usr/bin/env python3
"""
train_survival_assets.py
Trains the semiprime survival fingerprint and saves:
  - weights & multipliers (json)
  - scaler params for A_N and M_N (json)
  - logistic model (pickle)
"""
import argparse
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from semiprime_survival_matrix import preprocess_and_engineer, derive_weights, compute_fingerprints


def save_json(obj, path):
    """Save object as JSON file."""
    with open(path, 'w') as f:
        json.dump(obj, f, indent=2)
    print(f"[✓] saved json -> {path}")


def save_pickle(obj, path):
    """Save object as pickle file."""
    with open(path, 'wb') as f:
        pickle.dump(obj, f)
    print(f"[✓] saved pickle -> {path}")


def main():
    ap = argparse.ArgumentParser(description='Train semiprime survival fingerprint model')
    ap.add_argument('--csv', required=True, help='Titanic-like CSV file')
    ap.add_argument('--out-prefix', default='survival_assets', 
                    help='prefix for saved asset files')
    args = ap.parse_args()

    # Load and preprocess data
    df_raw = pd.read_csv(args.csv)
    print(f"[INFO] loaded {args.csv} rows={len(df_raw)}")
    df = preprocess_and_engineer(df_raw)

    # Use cv-safe weight derivation (train split) to prevent leakage
    if 'Survived' in df.columns:
        train, _ = train_test_split(df, test_size=0.2, random_state=0, 
                                     stratify=df['Survived'])
    else:
        train = df
    
    # Derive weights and multipliers from training set
    weights, multipliers = derive_weights(train, cv_safe=False)
    
    # Compute fingerprints across whole dataset using derived weights
    df_f, lr = compute_fingerprints(df, weights, multipliers, fit_logistic=True)
    
    # Extract scaler params from the computed fingerprints
    # We need to recompute these to save them
    scalerA_mean = float(df_f['A_N'].mean())
    scalerA_std = float(df_f['A_N'].std() + 1e-9)
    M_mean = float(df_f['M_N'].mean())
    M_std = float(df_f['M_N'].std() + 1e-9)

    scaler_info = {
        'A_N_mean': scalerA_mean,
        'A_N_std': scalerA_std,
        'M_N_mean': M_mean,
        'M_N_std': M_std
    }

    # Save everything
    save_json({'weights': weights, 'multipliers': multipliers}, 
              args.out_prefix + '_wm.json')
    save_json({'scaler': scaler_info}, 
              args.out_prefix + '_scaler.json')
    save_pickle(lr, args.out_prefix + '_logistic.pkl')

    # Also save a compact human summary
    if 'Survived' in df.columns and 'PredProb' in df_f.columns:
        residuals = df_f['Survived'].sub(df_f['PredProb']).abs()
        outlier_threshold = 2 * residuals.std()
        outlier_count = int(residuals.gt(outlier_threshold).sum())
        survival_rate = float(df['Survived'].mean())
    else:
        outlier_count = 0
        survival_rate = 0.0
    
    summary = {
        'n': int(len(df)),
        'survival_rate': survival_rate,
        'outlier_count': outlier_count
    }
    save_json({'summary': summary}, args.out_prefix + '_summary.json')
    
    print("[✓] Training & serialization complete.")
    print(f"[INFO] Model accuracy on training data: {lr.score(df_f[['Phi_N']].fillna(0), df['Survived']):.4f}")


if __name__ == '__main__':
    main()
