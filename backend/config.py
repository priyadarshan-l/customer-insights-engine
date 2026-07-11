"""
Configuration settings for the backend
"""

import os
from pathlib import Path

# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
ASSETS_DIR = BASE_DIR / "src" / "assets"

# Model settings
CLUSTERING_MODEL_PATH = MODELS_DIR / "clustering_pipeline.pkl"
CHURN_MODEL_PATH = MODELS_DIR / "churn_prediction_pipeline.pkl"
TRAINING_DATA_PATH = DATA_DIR / "customers.csv"
SEGMENTED_DATA_PATH = DATA_DIR / "customers_segmented.csv"

# API settings
API_TITLE = "Smart Customer Insights Engine"
API_VERSION = "1.0.0"
API_DESCRIPTION = "AI-powered customer churn prediction with behavioral intelligence"

# Risk thresholds
RISK_THRESHOLDS = {
    "URGENT": 0.7,
    "MONITOR": 0.4,
    "STABLE": 0.0
}

# CORS settings (configure for production)
CORS_ORIGINS = ["*"]  # Update with specific origins in production

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
