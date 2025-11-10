// constants.ts
import { KaggleCompetition, ModelTemplate } from './types';

export const BACKEND_API_BASE_URL = 'http://localhost:5000'; // Change this to your deployed backend URL in production

export const MOCK_KAGGLE_COMPETITIONS: KaggleCompetition[] = [
  {
    id: 'titanic',
    title: 'Titanic - Machine Learning from Disaster',
    description: 'The classic Kaggle introductory competition. Predict survival on the Titanic.',
    deadline: '2025-12-31T23:59:59Z',
    prize: 'Knowledge',
    status: 'active',
    bannerImage: 'https://picsum.photos/400/200?random=1',
  },
  {
    id: 'digit-recognizer',
    title: 'Digit Recognizer',
    description: 'Learn computer vision fundamentals with the MNIST dataset.',
    deadline: '2025-11-15T18:00:00Z',
    prize: 'Knowledge',
    status: 'active',
    bannerImage: 'https://picsum.photos/400/200?random=2',
  },
  {
    id: 'house-prices-advanced-regression-techniques',
    title: 'House Prices - Advanced Regression Techniques',
    description: 'Predict sales prices and practice feature engineering, RFs, and gradient boosting.',
    deadline: '2025-10-01T12:00:00Z',
    prize: 'Knowledge',
    status: 'active',
    bannerImage: 'https://picsum.photos/400/200?random=3',
  },
  {
    id: 'store-sales-forecasting',
    title: 'Store Sales - Forecasting',
    description: 'Predict sales for the next few months in Ecuador.',
    deadline: '2024-08-01T09:00:00Z',
    prize: '$5,000',
    status: 'active',
    bannerImage: 'https://picsum.photos/400/200?random=4',
  },
  {
    id: 'nlp-getting-started',
    title: 'NLP with Disaster Tweets',
    description: 'Predict which tweets are about real disasters and which are not.',
    deadline: '2024-07-20T17:00:00Z',
    prize: 'Knowledge',
    status: 'active',
    bannerImage: 'https://picsum.photos/400/200?random=5',
  },
];

export const MOCK_MODEL_TEMPLATES: ModelTemplate[] = [
  {
    id: 'lr',
    name: 'Logistic Regression',
    description: 'A simple linear model for binary classification problems.',
    codeSnippet: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# --- This is a simplified placeholder. In a real scenario, you'd load and preprocess your data here. ---
# For demonstration:
# X = pd.read_csv('train_features.csv')
# y = pd.read_csv('train_target.csv')

# Placeholder data
data = {
    'feature1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'feature2': [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    'target': [0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
}
df = pd.DataFrame(data)
X = df[['feature1', 'feature2']]
y = df['target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LogisticRegression(random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"Model trained: Logistic Regression with accuracy: {accuracy:.2f}")
# In a real Kaggle submission, you'd predict on test data and save to CSV.
# test_data = pd.read_csv('test_features.csv')
# test_predictions = model.predict(test_data)
# pd.DataFrame({'Id': test_ids, 'Predicted': test_predictions}).to_csv('submission.csv', index=False)
`,
  },
  {
    id: 'rf',
    name: 'Random Forest Classifier',
    description: 'An ensemble method using multiple decision trees for robust classification.',
    codeSnippet: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# --- This is a simplified placeholder. In a real scenario, you'd load and preprocess your data here. ---
# For demonstration:
# X = pd.read_csv('train_features.csv')
# y = pd.read_csv('train_target.csv')

# Placeholder data
data = {
    'feature1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    'feature2': [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    'target': [0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
}
df = pd.DataFrame(data)
X = df[['feature1', 'feature2']]
y = df['target']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"Model trained: Random Forest Classifier with accuracy: {accuracy:.2f}")
# In a real Kaggle submission, you'd predict on test data and save to CSV.
# test_data = pd.read_csv('test_features.csv')
# test_predictions = model.predict(test_data)
# pd.DataFrame({'Id': test_ids, 'Predicted': test_predictions}).to_csv('submission.csv', index=False)
`,
  },
  {
    id: 'cnn_image',
    name: 'Simple CNN for Images',
    description: 'A basic Convolutional Neural Network (CNN) for image classification (e.g., MNIST).',
    codeSnippet: `import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
from tensorflow.keras.datasets import mnist

# Load and preprocess MNIST data (example for Digit Recognizer competition)
(X_train, y_train), (X_test, y_test) = mnist.load_data()

# Reshape data for CNN input (add channel dimension)
X_train = X_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
X_test = X_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0

# Build a simple CNN model
model = Sequential([
    Conv2D(32, kernel_size=(3, 3), activation='relu', input_shape=(28, 28, 1)),
    MaxPooling2D(pool_size=(2, 2)),
    Flatten(),
    Dense(128, activation='relu'),
    Dense(10, activation='softmax') # 10 classes for digits 0-9
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# Train the model (using a small subset for quick simulation)
model.fit(X_train[:1000], y_train[:1000], epochs=3, batch_size=32, verbose=0)

loss, accuracy = model.evaluate(X_test[:100], y_test[:100], verbose=0)
print(f"Model trained: Simple CNN with accuracy: {accuracy:.2f}")
# In a real Kaggle submission, you'd predict on unseen test images.
# test_images = load_kaggle_test_images()
# test_predictions = np.argmax(model.predict(test_images), axis=1)
# pd.DataFrame({'ImageId': test_ids, 'Label': test_predictions}).to_csv('submission.csv', index=False)
`,
  },
  {
    id: 'srol-unified-law-engine',
    name: 'SROL Unified Law Engine (Crypto & Titanic)',
    description: 'A robust engine to extract underlying laws from diverse datasets (cryptographic timing, sociological survival) using regression and matrix-based analysis. Features the SROL stamp for advanced insights, perfect for AI curriculum development.',
    codeSnippet: `#!/usr/bin/env python3
import argparse
import pandas as pd
import numpy as np
import statsmodels.api as sm # For OLS regression
import matplotlib.pyplot as plt
import os
import random # For simulating data if not provided

# SROL Stamp
SROL_STAMP = "SROL Spartan R&D - Unified Law Engine v1.0"

def run_crypto_lambda_engine(args):
    """
    Simulates the Lambda-Law Regression Pipeline for cryptographic timing data.
    log10(T) = a * log10(λ) + b * bits + c
    """
    print(f"\\n--- \${SROL_STAMP}: Crypto Lambda Engine ---")
    print(f"Analyzing data from: \${args.input_data or 'simulated data'}")

    if args.input_data:
        try:
            df = pd.read_csv(args.input_data)
            # Ensure columns exist, create dummy if not for simulation
            if 'T' not in df.columns: df['T'] = np.exp(np.random.rand(len(df)) * 5) # Time
            if 'lambda' not in df.columns: df['lambda'] = np.exp(np.random.rand(len(df)) * 3) # Lambda value
            if 'bits' not in df.columns: df['bits'] = np.random.randint(64, 256, len(df)) # Bit length
        except FileNotFoundError:
            print(f"ERROR: Input data file '\${args.input_data}' not found. Generating simulated data.")
            df = create_simulated_crypto_data(args.num_samples)
    else:
        df = create_simulated_crypto_data(args.num_samples)

    if len(df) < 5:
        print("ERROR: Not enough data for meaningful regression. Need at least 5 samples.")
        return

    df['log10_T'] = np.log10(df['T'])
    df['log10_lambda'] = np.log10(df['lambda'])

    # Define independent variables (X) and dependent variable (y)
    X = df[['log10_lambda', 'bits']]
    X = sm.add_constant(X) # Add an intercept term
    y = df['log10_T']

    # Perform OLS regression
    model = sm.OLS(y, X)
    results = model.fit()

    print("\\n--- Crypto Lambda Regression Results ---")
    print(results.summary())

    # Extract coefficients
    a = results.params['log10_lambda'] if 'log10_lambda' in results.params else 0
    b = results.params['bits'] if 'bits' in results.params else 0
    c = results.params['const'] if 'const' in results.params else 0

    print(f"\\nExtracted Law: log10(T) = \${a:.4f} * log10(λ) + \${b:.4f} * bits + \${c:.4f}")

    # Residual diagnostics plot
    if args.plot_residuals:
        plt.figure(figsize=(10, 6))
        plt.scatter(results.fittedvalues, results.resid)
        plt.axhline(0, color='red', linestyle='--')
        plt.title('Residuals vs. Fitted Values (Crypto Lambda)')
        plt.xlabel('Fitted log10(T)')
        plt.ylabel('Residuals')
        plt.grid(True)
        # In a real CLI, save to file. Here, just note it.
        # plt.savefig('crypto_lambda_residuals.png') 
        print("Residuals plot conceptually generated as crypto_lambda_residuals.png")

    print("\\n--- Crypto Lambda Engine Complete ---")


def create_simulated_crypto_data(num_samples=100):
    np.random.seed(42) # for reproducibility
    _lambda = np.exp(np.random.rand(num_samples) * 3 + 1) # lambda from ~e^1 to e^4
    _bits = np.random.randint(64, 256, num_samples) # bits from 64 to 255
    
    # Simulate T based on a known law + some noise
    # log10(T) = 0.8 * log10(λ) + 0.01 * bits + 2.0 + noise
    log10_T = 0.8 * np.log10(_lambda) + 0.01 * _bits + 2.0 + np.random.randn(num_samples) * 0.2
    _T = 10**log10_T
    
    return pd.DataFrame({'T': _T, 'lambda': _lambda, 'bits': _bits})


def run_titanic_survival_matrix_engine(args):
    """
    Simulates the Semiprime Fingerprint Survival Matrix for Titanic data.
    Φ(N) = A(N) × M(N)
    (Conceptual implementation of a custom survival probability model)
    """
    print(f"\\n--- \${SROL_STAMP}: Titanic Survival Matrix Engine ---")
    print(f"Analyzing data from: \${args.input_data or 'simulated data'}")

    if args.input_data:
        try:
            df = pd.read_csv(args.input_data)
            # Ensure essential columns exist, create dummy if not
            if 'Age' not in df.columns: df['Age'] = np.random.randint(1, 80, len(df))
            if 'Sex' not in df.columns: df['Sex'] = np.random.choice(['male', 'female'], len(df))
            if 'Pclass' not in df.columns: df['Pclass'] = np.random.randint(1, 4, len(df))
            if 'Fare' not in df.columns: df['Fare'] = np.random.rand(len(df)) * 100
            if 'Survived' not in df.columns: df['Survived'] = np.random.randint(0, 2, len(df))
        except FileNotFoundError:
            print(f"ERROR: Input data file '\${args.input_data}' not found. Generating simulated data.")
            df = create_simulated_titanic_data(args.num_samples)
    else:
        df = create_simulated_titanic_data(args.num_samples)

    if len(df) < 5:
        print("ERROR: Not enough data for meaningful analysis. Need at least 5 samples.")
        return

    # --- Conceptual implementation of Φ(N) = A(N) × M(N) ---
    # A(N): Additive factors (e.g., age-based survival likelihood)
    # M(N): Multiplicative factors (e.g., gender/class influence)

    # Simplified A(N) - survival chances generally decrease with age, but increase for children
    df['Age_Factor'] = 1 / (1 + np.exp( (df['Age'] - 30) / 10 )) # sigmoid-like
    df.loc[df['Age'] < 10, 'Age_Factor'] = 0.8 # Children have higher factor
    
    # Simplified M(N) - gender/class interaction
    # Female 1st class -> highest factor
    # Male 3rd class -> lowest factor
    df['Gender_Class_Factor'] = 0.5 # Base factor
    df.loc[(df['Sex'] == 'female') & (df['Pclass'] == 1), 'Gender_Class_Factor'] = 1.2
    df.loc[(df['Sex'] == 'female') & (df['Pclass'] == 2), 'Gender_Class_Factor'] = 1.0
    df.loc[(df['Sex'] == 'female') & (df['Pclass'] == 3), 'Gender_Class_Factor'] = 0.8
    df.loc[(df['Sex'] == 'male') & (df['Pclass'] == 1), 'Gender_Class_Factor'] = 0.6
    df.loc[(df['Sex'] == 'male') & (df['Pclass'] == 2), 'Gender_Class_Factor'] = 0.4
    df.loc[(df['Sex'] == 'male') & (df['Pclass'] == 3), 'Gender_Class_Factor'] = 0.2

    # Calculate Conceptual Survival Probability Φ(N)
    df['Conceptual_Survival_Prob'] = df['Age_Factor'] * df['Gender_Class_Factor']
    df['Conceptual_Survival_Prob'] = df['Conceptual_Survival_Prob'].clip(0, 1) # Ensure probabilities are between 0 and 1

    # Compare with actual survival (if available) to find residuals/outliers
    if 'Survived' in df.columns:
        df['Prediction'] = (df['Conceptual_Survival_Prob'] > 0.5).astype(int)
        df['Residual'] = df['Survived'] - df['Conceptual_Survival_Prob']
        df['Abs_Residual'] = np.abs(df['Residual'])
        
        avg_abs_residual = df['Abs_Residual'].mean()
        print(f"\\nAverage Absolute Residual (Deviation from Law): \${avg_abs_residual:.4f}")
        
        outliers = df[df['Abs_Residual'] > args.outlier_threshold]
        print(f"\\nDetected \${len(outliers)} outliers (deviation > \${args.outlier_threshold}):")
        if not outliers.empty:
            print(outliers[['Age', 'Sex', 'Pclass', 'Fare', 'Survived', 'Conceptual_Survival_Prob', 'Residual', 'Abs_Residual']].head())
        else:
            print("No significant outliers detected.")

    print("\\n--- Survival Matrix Law Parameters ---")
    print(f"Age Factor: Decreases with age (except children < 10 have higher chance)")
    print(f"Gender/Class Multipliers: Female 1st Class (1.2) > Female 2nd (1.0) > Female 3rd (0.8) > Male 1st (0.6) > Male 2nd (0.4) > Male 3rd (0.2)")
    print("Survival probability is derived from these interacting factors.")

    if args.plot_distribution and 'Survived' in df.columns:
        plt.figure(figsize=(10, 6))
        df['Conceptual_Survival_Prob'].hist(bins=20, alpha=0.7, label='Conceptual Prob')
        df[df['Survived'] == 1]['Conceptual_Survival_Prob'].hist(bins=20, alpha=0.7, label='Actual Survived Prob')
        plt.title('Conceptual vs Actual Survival Probability Distribution')
        plt.xlabel('Probability')
        plt.ylabel('Frequency')
        plt.legend()
        plt.grid(True)
        # In a real CLI, save to file. Here, just note it.
        # plt.savefig('titanic_survival_prob_distribution.png')
        print("Survival probability distribution plot conceptually generated as titanic_survival_prob_distribution.png")

    print("\\n--- Titanic Survival Matrix Engine Complete ---")


def build_parser():
    parser = argparse.ArgumentParser(
        description=f"\${SROL_STAMP} - A Unified Command-Line Engine for Law Extraction and Analysis.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    
    # Global arguments
    parser.add_argument("--input-data", type=str, help="Path to input CSV data file.")
    parser.add_argument("--num-samples", type=int, default=100,
                        help="Number of simulated samples if no input data is provided (default: 100).")

    subparsers = parser.add_subparsers(dest="engine_type", required=True,
                                       help="Select the law extraction engine to run.")

    # Crypto Lambda Engine
    parser_crypto = subparsers.add_parser(
        "crypto-lambda",
        help="Run the Lambda-Law Regression Pipeline for cryptographic timing data.",
        description="""
The 'crypto-lambda' engine models cryptographic resistance time (T) against lambda (λ) and bit-length.
It extracts 'physical laws' in the form of regression coefficients:
  log10(T) = a * log10(λ) + b * bits + c
This helps understand the scaling behavior of cryptographic primitives.
        """
    )
    parser_crypto.add_argument("--plot-residuals", action="store_true",
                               help="Generate a residuals plot for diagnostic analysis.")
    parser_crypto.set_defaults(func=run_crypto_lambda_engine)

    # Titanic Survival Matrix Engine
    parser_titanic = subparsers.add_parser(
        "titanic-survival-matrix",
        help="Run the Semiprime Fingerprint Survival Matrix for Titanic disaster data.",
        description="""
The 'titanic-survival-matrix' engine applies a conceptual law (Φ(N) = A(N) × M(N))
to predict survival probabilities on the Titanic.
A(N) represents additive factors (e.g., age influence), M(N) represents multiplicative
factors (e.g., gender/class interaction).
This engine focuses on extracting 'sociological laws' and identifying outliers (deviations from the law).
        """
    )
    parser_titanic.add_argument("--outlier-threshold", type=float, default=0.2,
                                help="Threshold for absolute residual to classify as an outlier (default: 0.2).")
    parser_titanic.add_argument("--plot-distribution", action="store_true",
                                help="Generate a distribution plot of conceptual vs. actual survival probabilities.")
    parser_titanic.set_defaults(func=run_titanic_survival_matrix_engine)

    return parser

def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
`,
  },
];