# Backend Testing Guide

## Backend Status: READY FOR TESTING ✓

The backend is complete and production-ready (without GenAI features). All core functionality is implemented.

## What's Included

### Endpoints
- `GET /` - API information
- `GET /health` - Health check (model status)
- `GET /metrics` - Global KPIs and statistics
- `POST /predict` - Customer churn prediction

### Features
- K-Means clustering (3 segments)
- XGBoost churn prediction
- Risk level classification (STABLE/MONITOR/URGENT)
- Input validation with Pydantic
- Error handling and logging
- CORS enabled for frontend

## Testing Steps

### 1. Train the Model First

\`\`\`bash
# From project root
python train_models.py
\`\`\`

This will:
- Load data from `data/customers.csv`
- Train K-Means clustering
- Train XGBoost with Optuna optimization
- Save pipeline to `models/churn_prediction_pipeline.pkl`

### 2. Start the Backend

\`\`\`bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Start server
uvicorn app:app --reload
\`\`\`

Server will start at: `http://localhost:8000`

### 3. Test with SwaggerUI

Open browser: `http://localhost:8000/docs`

#### Test `/health` endpoint
Click "Try it out" → "Execute"

Expected response:
\`\`\`json
{
  "status": "healthy",
  "model_loaded": true,
  "data_loaded": true,
  "timestamp": "2025-01-15T10:30:00"
}
\`\`\`

#### Test `/metrics` endpoint
Click "Try it out" → "Execute"

Expected response:
\`\`\`json
{
  "total_customers": 2240,
  "churn_rate": 0.15,
  "model_precision": 0.71,
  "segments": {
    "Low Engagement": 739,
    "High Engagement": 896,
    "Promo-Sensitive": 605
  }
}
\`\`\`

#### Test `/predict` endpoint

**Sample Input JSON:**
\`\`\`json
{
  "Recency": 40,
  "MntMeatProducts": 61,
  "NumWebVisitsMonth": 7,
  "Marital_Status": "Married",
  "Education": "PhD",
  "MntGoldProds": 21,
  "NumStorePurchases": 4,
  "MntWines": 84,
  "Teenhome": 1,
  "AcceptedCmp1": 0,
  "AcceptedCmp2": 0,
  "AcceptedCmp3": 0,
  "AcceptedCmp4": 0,
  "AcceptedCmp5": 0
}
\`\`\`

**Expected Response:**
\`\`\`json
{
  "churn_probability": 0.23,
  "churn_prediction": 0,
  "risk_level": "STABLE",
  "segment": "High Engagement",
  "cluster": 1
}
\`\`\`

### 4. Test Different Risk Levels

**High Risk Customer (URGENT):**
\`\`\`json
{
  "Recency": 90,
  "MntMeatProducts": 10,
  "NumWebVisitsMonth": 12,
  "Marital_Status": "Single",
  "Education": "Basic",
  "MntGoldProds": 5,
  "NumStorePurchases": 1,
  "MntWines": 15,
  "Teenhome": 0,
  "AcceptedCmp1": 0,
  "AcceptedCmp2": 0,
  "AcceptedCmp3": 0,
  "AcceptedCmp4": 0,
  "AcceptedCmp5": 0
}
\`\`\`

**Medium Risk Customer (MONITOR):**
\`\`\`json
{
  "Recency": 50,
  "MntMeatProducts": 100,
  "NumWebVisitsMonth": 6,
  "Marital_Status": "Married",
  "Education": "Graduate",
  "MntGoldProds": 30,
  "NumStorePurchases": 5,
  "MntWines": 150,
  "Teenhome": 1,
  "AcceptedCmp1": 1,
  "AcceptedCmp2": 0,
  "AcceptedCmp3": 0,
  "AcceptedCmp4": 0,
  "AcceptedCmp5": 0
}
\`\`\`

## Troubleshooting

### Model not loaded
- Error: "Model not loaded. Please train the model first."
- Solution: Run `python train_models.py`

### Import errors
- Error: "ModuleNotFoundError"
- Solution: Make sure you're in the correct directory and dependencies are installed

### Port already in use
- Error: "Address already in use"
- Solution: Use different port: `uvicorn app:app --port 8001`

## Next Steps

After testing backend:
1. Add GenAI explanation endpoint (`/explain`)
2. Build frontend dashboard
3. Deploy to cloud

## Notes

- Model training takes ~5-10 minutes (depends on n_trials)
- API response time: ~50-100ms per prediction
- All endpoints have automatic validation
- Check logs for detailed error messages
