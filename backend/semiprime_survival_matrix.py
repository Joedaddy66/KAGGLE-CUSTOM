#!/usr/bin/env python3
"""
semiprime_survival_matrix.py
Core functions for the Semiprime Survival Fingerprint Matrix Engine.
Provides preprocessing, weight derivation, and fingerprint computation.
"""
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


def preprocess_and_engineer(df_raw):
    """
    Preprocess and engineer features for Titanic-like survival data.
    
    Args:
        df_raw: Raw dataframe with passenger data
        
    Returns:
        Processed dataframe with engineered features
    """
    df = df_raw.copy()
    
    # Fill missing values
    if 'Age' in df.columns:
        df['Age'] = df['Age'].fillna(df['Age'].median())
    if 'Fare' in df.columns:
        df['Fare'] = df['Fare'].fillna(df['Fare'].median())
    if 'Embarked' in df.columns:
        df['Embarked'] = df['Embarked'].fillna('S')
    
    # Create binary features
    if 'Sex' in df.columns:
        df['IsFemale'] = (df['Sex'] == 'female').astype(int)
        df['IsMale'] = (df['Sex'] == 'male').astype(int)
    
    if 'Cabin' in df.columns:
        df['HasCabin'] = df['Cabin'].notnull().astype(int)
    
    # Pclass dummies
    if 'Pclass' in df.columns:
        df['Pclass_1'] = (df['Pclass'] == 1).astype(int)
        df['Pclass_2'] = (df['Pclass'] == 2).astype(int)
        df['Pclass_3'] = (df['Pclass'] == 3).astype(int)
    
    # Embarked dummies
    if 'Embarked' in df.columns:
        df['Embarked_C'] = (df['Embarked'] == 'C').astype(int)
        df['Embarked_Q'] = (df['Embarked'] == 'Q').astype(int)
        df['Embarked_S'] = (df['Embarked'] == 'S').astype(int)
    
    # Family size features
    if 'SibSp' in df.columns and 'Parch' in df.columns:
        df['FamilySize'] = df['SibSp'] + df['Parch'] + 1
        df['IsAlone'] = (df['FamilySize'] == 1).astype(int)
        
        # Family size buckets
        df['FamilyBuck'] = 'Medium'
        df.loc[df['FamilySize'] == 1, 'FamilyBuck'] = 'Solo'
        df.loc[df['FamilySize'] == 2, 'FamilyBuck'] = 'Small'
        df.loc[df['FamilySize'] >= 5, 'FamilyBuck'] = 'Large'
        
        df['Family_Solo'] = (df['FamilyBuck'] == 'Solo').astype(int)
        df['Family_Small'] = (df['FamilyBuck'] == 'Small').astype(int)
        df['Family_Medium'] = (df['FamilyBuck'] == 'Medium').astype(int)
        df['Family_Large'] = (df['FamilyBuck'] == 'Large').astype(int)
    
    # Age groups
    if 'Age' in df.columns:
        df['IsChild'] = (df['Age'] < 10).astype(int)
        df['IsYoung'] = ((df['Age'] >= 10) & (df['Age'] < 30)).astype(int)
        df['IsMiddle'] = ((df['Age'] >= 30) & (df['Age'] < 50)).astype(int)
        df['IsElderly'] = (df['Age'] >= 50).astype(int)
    
    return df


def derive_weights(df, cv_safe=True):
    """
    Derive additive weights and multiplicative factors from training data.
    
    Args:
        df: Preprocessed dataframe
        cv_safe: If True, use train/test split to avoid leakage
        
    Returns:
        Tuple of (weights_dict, multipliers_dict)
    """
    if cv_safe and 'Survived' in df.columns:
        train_df, _ = train_test_split(df, test_size=0.2, random_state=42, 
                                        stratify=df['Survived'])
    else:
        train_df = df
    
    # Additive weights - correlation-based
    weights = {}
    
    additive_features = ['IsFemale', 'Pclass_1', 'Pclass_2', 'Pclass_3', 
                         'IsChild', 'Family_Solo', 'Family_Small', 
                         'Family_Medium', 'Family_Large', 'Embarked_C', 
                         'Embarked_Q', 'Embarked_S']
    
    if 'Survived' in train_df.columns:
        for feat in additive_features:
            if feat in train_df.columns:
                corr = train_df[feat].corr(train_df['Survived'])
                weights[feat] = float(corr) if not np.isnan(corr) else 0.0
    else:
        # Default weights if no target
        for feat in additive_features:
            if feat in train_df.columns:
                weights[feat] = 0.1
    
    # Multiplicative factors - survival rate ratios
    multipliers = {}
    
    if 'Survived' in train_df.columns:
        base_survival = train_df['Survived'].mean()
        
        # Female multiplier
        if 'IsFemale' in train_df.columns:
            female_survival = train_df[train_df['IsFemale'] == 1]['Survived'].mean()
            multipliers['IsFemale'] = float(female_survival / base_survival) if base_survival > 0 else 1.0
        
        # First class multiplier
        if 'Pclass_1' in train_df.columns:
            p1_survival = train_df[train_df['Pclass_1'] == 1]['Survived'].mean()
            multipliers['Pclass_1'] = float(p1_survival / base_survival) if base_survival > 0 else 1.0
        
        # Has cabin multiplier
        if 'HasCabin' in train_df.columns:
            cabin_survival = train_df[train_df['HasCabin'] == 1]['Survived'].mean()
            multipliers['HasCabin'] = float(cabin_survival / base_survival) if base_survival > 0 else 1.0
    else:
        # Default multipliers
        multipliers = {'IsFemale': 1.5, 'Pclass_1': 1.3, 'HasCabin': 1.2}
    
    return weights, multipliers


def compute_fingerprints(df, weights, multipliers, fit_logistic=True):
    """
    Compute A(N), M(N), and Phi(N) fingerprints for survival prediction.
    
    Args:
        df: Preprocessed dataframe
        weights: Dictionary of additive weights
        multipliers: Dictionary of multiplicative factors
        fit_logistic: Whether to fit and return a logistic regression model
        
    Returns:
        Tuple of (df_with_fingerprints, logistic_model or None)
    """
    df_out = df.copy()
    
    # Compute A(N) - additive component
    A = np.zeros(len(df_out))
    for col, w in weights.items():
        if col in df_out.columns:
            A += df_out[col].values * float(w)
    
    # Add age-based contribution if available
    if 'Age' in df_out.columns and df_out['Age'].notnull().any():
        age_median = df_out['Age'].median()
        age_log = np.log1p(df_out['Age'].fillna(age_median))
        age_mean = age_log.mean()
        age_std = age_log.std() + 1e-9
        A += (age_log - age_mean) / age_std
    
    df_out['A_N'] = A
    
    # Compute M(N) - multiplicative component
    M = np.ones(len(df_out))
    for k, v in multipliers.items():
        if k in df_out.columns:
            M *= np.where(df_out[k] == 1, float(v), 1.0)
    
    df_out['M_N'] = M
    
    # Scale A(N) and M(N)
    scaler_A = StandardScaler()
    scaler_M = StandardScaler()
    
    df_out['A_N_scaled'] = scaler_A.fit_transform(df_out[['A_N']])
    df_out['M_N_scaled'] = scaler_M.fit_transform(df_out[['M_N']])
    
    # Compute Phi(N) = A(N) × M(N)
    df_out['Phi_N'] = df_out['A_N_scaled'] * df_out['M_N_scaled']
    
    # Fit logistic regression if requested
    lr_model = None
    if fit_logistic and 'Survived' in df_out.columns:
        X = df_out[['Phi_N']].fillna(0)
        y = df_out['Survived']
        lr_model = LogisticRegression(random_state=42, max_iter=1000)
        lr_model.fit(X, y)
        df_out['PredProb'] = lr_model.predict_proba(X)[:, 1]
    
    return df_out, lr_model
