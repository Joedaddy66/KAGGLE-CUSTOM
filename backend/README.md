# Semiprime Survival Fingerprint Backend

Flask backend for the Kaggle Submission Assistant that implements the Semiprime Survival Fingerprint Matrix Engine for Titanic survival predictions.

## Overview

This backend provides a REST API for predicting passenger survival using the semiprime survival fingerprint methodology:
- **A(N)**: Additive factors (age, class, gender, etc.)
- **M(N)**: Multiplicative factors (gender/class interactions)
- **Φ(N) = A(N) × M(N)**: Combined fingerprint for survival prediction

## Files

- `app.py` - Flask backend server with prediction endpoint
- `train_survival_assets.py` - Training script to generate model assets
- `semiprime_survival_matrix.py` - Core functions for preprocessing and fingerprint computation
- `requirements.txt` - Python dependencies
- `sample_titanic.csv` - Sample dataset for testing (if available)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Train the Model

Using your own Titanic dataset:

```bash
python train_survival_assets.py --csv /path/to/titanic.csv
```

This will generate:
- `survival_assets_wm.json` - Weights and multipliers
- `survival_assets_scaler.json` - Scaler parameters
- `survival_assets_logistic.pkl` - Trained logistic regression model
- `survival_assets_summary.json` - Training summary

### 3. Run the Backend

```bash
python app.py
```

The server will start on `http://localhost:5000`

### 4. Test the API

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Single Passenger Prediction:**
```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "PassengerId": 9999,
    "Name": "Doe, Mr. John",
    "Pclass": 3,
    "Sex": "male",
    "Age": 28,
    "SibSp": 0,
    "Parch": 0,
    "Ticket": "A/5 21171",
    "Fare": 7.25,
    "Cabin": null,
    "Embarked": "S"
  }'
```

**Batch Prediction:**
```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d '[
    {
      "Name": "Smith, Mrs. Jane",
      "Pclass": 1,
      "Sex": "female",
      "Age": 35,
      "SibSp": 1,
      "Parch": 0,
      "Fare": 71.0,
      "Embarked": "C"
    },
    {
      "Name": "Brown, Mr. Bob",
      "Pclass": 3,
      "Sex": "male",
      "Age": 22,
      "SibSp": 0,
      "Parch": 0,
      "Fare": 8.05,
      "Embarked": "S"
    }
  ]'
```

## API Endpoints

### GET /health

Health check endpoint that returns backend status.

**Response:**
```json
{
  "status": "ok",
  "assets_loaded": true,
  "kaggleConfigured": false,
  "survival_model_ready": true
}
```

### POST /predict

Predict survival probability for one or more passengers.

**Request Body:** JSON object or array of passenger objects

**Required Fields:** None (all fields are optional, but more fields = better prediction)

**Common Fields:**
- `Name` - Passenger name
- `Pclass` - Passenger class (1, 2, or 3)
- `Sex` - Gender ("male" or "female")
- `Age` - Age in years
- `SibSp` - Number of siblings/spouses aboard
- `Parch` - Number of parents/children aboard
- `Fare` - Ticket fare
- `Cabin` - Cabin number
- `Embarked` - Port of embarkation (C, Q, or S)
- `Survived` - (Optional) For training/evaluation only

**Response:**
```json
{
  "n": 1,
  "results": [
    {
      "input_index": 0,
      "passenger_name": "Doe, Mr. John",
      "Phi_N": -0.8234,
      "A_N": -0.4567,
      "M_N": 0.3456,
      "predicted_survival_probability": 0.1234,
      "observed_survived": null,
      "outlier_score_signed": null
    }
  ]
}
```

## Environment Variables

- `SROL_ASSET_PREFIX` - Prefix for asset files (default: `survival_assets`)
- `KAGGLE_USERNAME` - Your Kaggle username (for integration features)
- `KAGGLE_KEY` - Your Kaggle API key (for integration features)

## Security Notes

⚠️ **Important for Production:**

1. **Never run with `debug=True` in production** - Use Gunicorn or uWSGI:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:APP
   ```

2. **Use HTTPS** - Always serve over HTTPS in production

3. **Add Authentication** - Implement API key or OAuth authentication

4. **Validate Input** - The current implementation has minimal validation

5. **Rate Limiting** - Add rate limiting to prevent abuse

6. **Secure Asset Storage** - Store model assets in secure, versioned storage

## Model Training Tips

- Use a representative training dataset (at least a few hundred samples)
- Ensure the dataset has the `Survived` column for training
- The model automatically handles missing values
- Cross-validation is built into the training process
- Version your model assets for reproducibility

## Troubleshooting

**"Missing trained assets" error:**
- Run the training script first: `python train_survival_assets.py --csv your_data.csv`

**Import errors:**
- Make sure you're in the `backend` directory when running scripts
- Install all dependencies: `pip install -r requirements.txt`

**Poor predictions:**
- Train on a larger, more diverse dataset
- Check that input data matches the format of training data
- Verify all features are being passed correctly

## Integration with Frontend

The frontend expects the backend to run on `http://localhost:5000` by default. The `/health` endpoint must return `kaggleConfigured: true` to enable submission features.

To configure Kaggle integration:
```bash
export KAGGLE_USERNAME=your_username
export KAGGLE_KEY=your_api_key
python app.py
```
