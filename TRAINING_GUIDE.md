# 🚀 Complete Training Guide
## Customer Churn Prediction System

---

## 📋 Prerequisites

Ensure you have:
- Python 3.8+
- pip installed
- Jupyter Notebook (for notebook training)
- 4GB+ RAM (for Optuna optimization)

---

## 🎯 Training Options

### Option 1: Quick Training Script ⚡ (Recommended for Testing)

**Best for**: Quick testing, production deployment, automated training

**Command**:
\`\`\`bash
python train_models.py
\`\`\`

**What it does**:
1. Loads data from `data/customers.csv`
2. Engineers 8 powerful features
3. Trains K-Means clustering (3 segments)
4. Trains XGBoost with Optuna (50 trials)
5. Generates all visualizations (PCA, t-SNE, SHAP)
6. Saves models to `models/` folder
7. Saves plots to `src/assets/` folder

**Time**: 5-10 minutes

**Output**:
\`\`\`
models/
├── clustering_pipeline.pkl
└── churn_prediction_pipeline.pkl

src/assets/
├── cluster_distribution.png
├── cluster_pca_visual.png
├── cluster_tsne_visual.png
├── cluster_comparison_pca_tsne.png
├── confusion_matrix_improved.png
├── feature_importance.png
├── feature_importance.csv
├── shap_summary_beeswarm.png
├── shap_bar.png
├── shap_waterfall_sample0.png
├── shap_dependence_Recency.png
└── shap_force_plot.png
\`\`\`

---

### Option 2: Jupyter Notebooks 📓 (Recommended for Demonstration)

**Best for**: Faculty presentation, understanding the process, educational purposes

#### Step 1: Exploratory Data Analysis

\`\`\`bash
jupyter notebook notebooks/exploration.ipynb
\`\`\`

**What you'll see**:
- Data loading and overview
- Missing value analysis
- Feature distributions
- Correlation heatmaps
- Target variable analysis
- Key insights summary

**Time**: 5 minutes to run all cells

---

#### Step 2: Clustering Pipeline

\`\`\`bash
jupyter notebook notebooks/test_pipeline_cluster.ipynb
\`\`\`

**What you'll learn**:
- Feature engineering for clustering
- K-Means algorithm application
- Cluster analysis and interpretation
- PCA visualization (linear)
- t-SNE visualization (non-linear)
- Side-by-side comparison

**Outputs**:
- `models/clustering_pipeline.pkl`
- `data/customers_segmented.csv`
- Clustering visualizations in `src/assets/`

**Time**: 3-5 minutes

**Key Sections**:
1. Data Loading
2. Feature Engineering (TotalSpent, TotalPurchases, CampaignScore)
3. K-Means Clustering (3 segments)
4. Cluster Analysis
5. PCA Visualization
6. t-SNE Visualization
7. Comparison Plot
8. Pipeline Saving

---

#### Step 3: Prediction Pipeline

\`\`\`bash
jupyter notebook notebooks/test_pipeline_predict.ipynb
\`\`\`

**What you'll learn**:
- Feature selection based on SHAP importance
- XGBoost training with Optuna optimization
- Model evaluation metrics
- SHAP explainability analysis
- Feature importance ranking

**Outputs**:
- `models/churn_prediction_pipeline.pkl`
- SHAP visualizations in `src/assets/`
- Confusion matrix
- Feature importance plot

**Time**: 5-10 minutes (Optuna optimization)

**Key Sections**:
1. Data Loading (segmented data)
2. Feature Engineering
3. Train-Test Split
4. Optuna Hyperparameter Optimization
5. Model Training
6. Performance Evaluation
7. SHAP Analysis (5 plot types)
8. Pipeline Saving

---

## 🖥️ After Training: Start the Backend

### Start the API Server

\`\`\`bash
python -m uvicorn backend.app:app --reload
\`\`\`

**Expected Output**:
\`\`\`
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Model loaded successfully from models/churn_prediction_pipeline.pkl
INFO:     Backend initialization complete
\`\`\`

### Access the API

- **SwaggerUI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

---

## 🧪 Testing the API

### Test 1: Health Check

\`\`\`bash
curl http://localhost:8000/health
\`\`\`

**Expected Response**:
\`\`\`json
{
  "status": "healthy",
  "model_loaded": true,
  "data_loaded": true,
  "timestamp": "2024-01-15T10:30:00"
}
\`\`\`

---

### Test 2: Get Metrics

\`\`\`bash
curl http://localhost:8000/metrics
\`\`\`

**Expected Response**:
\`\`\`json
{
  "total_customers": 2240,
  "churn_rate": 0.15,
  "model_precision": 0.75,
  "segments": {
    "Low Engagement": 739,
    "High Engagement": 896,
    "Promo-Sensitive": 605
  }
}
\`\`\`

---

### Test 3: Predict Churn

**High-Risk Customer** (likely to churn):
\`\`\`json
{
  "Recency": 90,
  "MntMeatProducts": 10,
  "NumWebVisitsMonth": 8,
  "Marital_Status": "Single",
  "Education": "Basic",
  "MntGoldProds": 5,
  "NumStorePurchases": 1,
  "MntWines": 20,
  "Teenhome": 0,
  "AcceptedCmp1": 0,
  "AcceptedCmp2": 0,
  "AcceptedCmp3": 0,
  "AcceptedCmp4": 0,
  "AcceptedCmp5": 0
}
\`\`\`

**Expected Response**:
\`\`\`json
{
  "churn_probability": 0.82,
  "churn_prediction": 1,
  "risk_level": "URGENT",
  "segment": "Low Engagement",
  "cluster": 0
}
\`\`\`

---

**Low-Risk Customer** (likely to stay):
\`\`\`json
{
  "Recency": 15,
  "MntMeatProducts": 200,
  "NumWebVisitsMonth": 3,
  "Marital_Status": "Married",
  "Education": "PhD",
  "MntGoldProds": 80,
  "NumStorePurchases": 10,
  "MntWines": 500,
  "Teenhome": 1,
  "AcceptedCmp1": 1,
  "AcceptedCmp2": 1,
  "AcceptedCmp3": 0,
  "AcceptedCmp4": 1,
  "AcceptedCmp5": 0
}
\`\`\`

**Expected Response**:
\`\`\`json
{
  "churn_probability": 0.12,
  "churn_prediction": 0,
  "risk_level": "STABLE",
  "segment": "High Engagement",
  "cluster": 1
}
\`\`\`

---

## 🐛 Troubleshooting

### Issue 1: `FileNotFoundError: data/customers.csv`

**Cause**: Running from wrong directory or data file missing

**Solution**:
\`\`\`bash
# Make sure you're in project root
pwd  # Should show: .../customer-insights-engine

# Check if data exists
ls data/customers.csv

# If missing, the file should be in the project
\`\`\`

---

### Issue 2: `ModuleNotFoundError: No module named 'src'`

**Cause**: Python can't find the src module

**Solution** (in notebooks):
\`\`\`python
import sys
sys.path.append('..')  # This should be in the first cell
\`\`\`

**Solution** (in scripts):
\`\`\`bash
# Run from project root
python train_models.py  # ✅ Correct
cd src && python train.py  # ❌ Wrong
\`\`\`

---

### Issue 3: Backend won't start - "Model not loaded"

**Cause**: Models haven't been trained yet

**Solution**:
\`\`\`bash
# Train models first
python train_models.py

# Then start backend
python -m uvicorn backend.app:app --reload
\`\`\`

---

### Issue 4: Optuna is too slow

**Cause**: 50 trials takes time on slower machines

**Solution**: Edit `train_models.py` and reduce trials:
\`\`\`python
# Change this line:
study.optimize(objective, n_trials=50, show_progress_bar=True)

# To this:
study.optimize(objective, n_trials=10, show_progress_bar=True)
\`\`\`

---

### Issue 5: Out of Memory during training

**Cause**: Not enough RAM for full dataset

**Solution**: Reduce dataset size in training script:
\`\`\`python
# Add this after loading data:
df = df.sample(n=1000, random_state=42)  # Use 1000 samples
\`\`\`

---

## 📊 Understanding the Outputs

### Clustering Visualizations

1. **cluster_distribution.png** - Bar chart showing segment sizes
2. **cluster_pca_visual.png** - PCA 2D projection (linear)
3. **cluster_tsne_visual.png** - t-SNE 2D projection (non-linear)
4. **cluster_comparison_pca_tsne.png** - Side-by-side comparison

**Interpretation**:
- PCA shows global structure and variance
- t-SNE shows local clusters and separation
- Both confirm distinct customer segments

---

### SHAP Visualizations

1. **shap_summary_beeswarm.png** - Feature impact across all predictions
   - Red = high feature value
   - Blue = low feature value
   - X-axis = impact on prediction

2. **shap_bar.png** - Mean absolute SHAP values (feature importance ranking)

3. **shap_waterfall_sample0.png** - Individual prediction breakdown
   - Shows how each feature contributes to one prediction

4. **shap_dependence_Recency.png** - How Recency affects predictions
   - Shows non-linear relationships

5. **shap_force_plot.png** - Visual prediction explanation
   - Red pushes prediction higher (churn)
   - Blue pushes prediction lower (stay)

---

## 🎓 For Faculty Presentation

### Recommended Flow:

**1. Introduction (2 min)**
- Explain the business problem (customer churn)
- Show project structure

**2. EDA (3 min)**
- Run `exploration.ipynb`
- Highlight key insights (churn rate, feature distributions)

**3. Clustering (5 min)**
- Run `test_pipeline_cluster.ipynb`
- Explain K-Means algorithm
- Show PCA vs t-SNE comparison
- Discuss segment characteristics

**4. Prediction (7 min)**
- Run `test_pipeline_predict.ipynb`
- Explain XGBoost and Optuna
- Show SHAP explainability
- Discuss feature importance

**5. Live Demo (3 min)**
- Start backend API
- Open SwaggerUI
- Test high-risk and low-risk customers
- Show real-time predictions

**6. Visualizations (2 min)**
- Open `src/assets/` folder
- Show professional plots
- Explain production readiness

**Total Time**: ~20 minutes

---

## 🚀 Production Deployment Notes

### Model Persistence
- Models saved with `joblib` for fast loading
- All preprocessing included in pipelines
- No external dependencies at inference time

### API Design
- RESTful endpoints
- Pydantic validation
- Automatic OpenAPI documentation
- CORS enabled for frontend

### Monitoring
- Logging configured
- Health check endpoint
- Error handling and status codes

### Scalability
- Stateless API design
- Can be containerized (Docker)
- Ready for cloud deployment

---

## 📝 Next Steps After Training

1. ✅ Models trained and saved
2. ✅ Visualizations generated
3. ✅ Backend API running
4. ⬜ Build React dashboard (optional)
5. ⬜ Add GenAI explanations (optional)
6. ⬜ Deploy to cloud (optional)

---

## 💡 Tips for Success

- Run notebooks cell-by-cell to understand each step
- Check `src/assets/` after training to see all plots
- Use SwaggerUI for interactive API testing
- Keep training logs for debugging
- Save notebook outputs before presenting

---

**You're all set! Happy training! 🎉**
