"""
Complete Training Pipeline: K-Means Clustering + XGBoost Classification
Handles data loading, preprocessing, clustering, model training, and saving
"""

import pandas as pd
import numpy as np
import joblib
import pickle
import os
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import KMeans
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import optuna
from sklearn.metrics import roc_auc_score, classification_report, confusion_matrix


class CustomerSegmentationPipeline:
    """
    Two-stage ML pipeline:
    1. K-Means clustering for customer segmentation
    2. XGBoost for churn prediction
    """
    
    def __init__(self, n_clusters=3, random_state=42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.kmeans_model = None
        self.xgb_model = None
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_names = None
        self.segment_labels = {
            0: "Low Engagement",
            1: "High Engagement", 
            2: "Promo-Sensitive"
        }
        
    def preprocess_data(self, df, fit=True):
        """Preprocess raw customer data"""
        df = df.copy()
        
        # Handle categorical columns
        categorical_cols = ['Education', 'Marital_Status']
        
        for col in categorical_cols:
            if col in df.columns:
                if fit:
                    self.label_encoders[col] = LabelEncoder()
                    df[col] = self.label_encoders[col].fit_transform(df[col].astype(str))
                else:
                    df[col] = self.label_encoders[col].transform(df[col].astype(str))
        
        # Create campaign score feature
        campaign_cols = ['AcceptedCmp1', 'AcceptedCmp2', 'AcceptedCmp3', 
                        'AcceptedCmp4', 'AcceptedCmp5', 'Response']
        available_campaign_cols = [col for col in campaign_cols if col in df.columns]
        
        if available_campaign_cols:
            df['CampaignScore'] = df[available_campaign_cols].sum(axis=1)
        
        return df
    
    def fit_clustering(self, X):
        """Fit K-Means clustering model"""
        print(f"Fitting K-Means with {self.n_clusters} clusters...")
        
        # Scale features for clustering
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit K-Means
        self.kmeans_model = KMeans(
            n_clusters=self.n_clusters,
            random_state=self.random_state,
            n_init=10
        )
        clusters = self.kmeans_model.fit_predict(X_scaled)
        
        print(f"Clustering complete. Cluster distribution:")
        for i in range(self.n_clusters):
            count = np.sum(clusters == i)
            print(f"  {self.segment_labels[i]}: {count} customers ({count/len(clusters)*100:.1f}%)")
        
        return clusters
    
    def fit_xgboost(self, X, y, n_trials=10):
        """Fit XGBoost model with Optuna hyperparameter tuning"""
        print(f"\nTraining XGBoost with Optuna ({n_trials} trials)...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=self.random_state, stratify=y
        )
        
        # Apply SMOTE for class balance
        smote = SMOTE(random_state=self.random_state)
        X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
        
        print(f"After SMOTE: {len(X_train_resampled)} training samples")
        
        # Optuna optimization
        def objective(trial):
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 500),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                'gamma': trial.suggest_float('gamma', 0, 5),
                'reg_alpha': trial.suggest_float('reg_alpha', 0, 2),
                'reg_lambda': trial.suggest_float('reg_lambda', 1, 5),
                'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
                'random_state': self.random_state,
                'eval_metric': 'logloss'
            }
            
            model = XGBClassifier(**params)
            model.fit(X_train_resampled, y_train_resampled)
            
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            score = roc_auc_score(y_test, y_pred_proba)
            
            return score
        
        study = optuna.create_study(direction='maximize')
        study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
        
        print(f"\nBest ROC-AUC: {study.best_value:.4f}")
        print("Best parameters:", study.best_params)
        
        # Train final model with best params
        best_params = study.best_params
        best_params['random_state'] = self.random_state
        best_params['eval_metric'] = 'logloss'
        
        self.xgb_model = XGBClassifier(**best_params)
        self.xgb_model.fit(X_train_resampled, y_train_resampled)
        
        # Evaluate
        y_pred = self.xgb_model.predict(X_test)
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Stay', 'Churn']))
        
        return study, X_test, y_test
    
    def save_pipeline(self, save_dir='models'):
        """Save complete pipeline to disk"""
        os.makedirs(save_dir, exist_ok=True)
        
        pipeline_data = {
            'kmeans_model': self.kmeans_model,
            'xgb_model': self.xgb_model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'segment_labels': self.segment_labels,
            'n_clusters': self.n_clusters
        }
        
        pipeline_path = os.path.join(save_dir, 'churn_prediction_pipeline.pkl')
        
        with open(pipeline_path, 'wb') as f:
            pickle.dump(pipeline_data, f)
        
        print(f"\nPipeline saved to: {pipeline_path}")
        print(f"File size: {os.path.getsize(pipeline_path) / 1024:.2f} KB")
        
        return pipeline_path
    
    @classmethod
    def load_pipeline(cls, pipeline_path='models/churn_prediction_pipeline.pkl'):
        """Load saved pipeline from disk"""
        with open(pipeline_path, 'rb') as f:
            pipeline_data = pickle.load(f)
        
        # Reconstruct pipeline object
        pipeline = cls(n_clusters=pipeline_data['n_clusters'])
        pipeline.kmeans_model = pipeline_data['kmeans_model']
        pipeline.xgb_model = pipeline_data['xgb_model']
        pipeline.scaler = pipeline_data['scaler']
        pipeline.label_encoders = pipeline_data['label_encoders']
        pipeline.feature_names = pipeline_data['feature_names']
        pipeline.segment_labels = pipeline_data['segment_labels']
        
        print(f"Pipeline loaded from: {pipeline_path}")
        return pipeline
    
    def predict(self, X):
        """Make predictions on new data"""
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get cluster assignment
        cluster = self.kmeans_model.predict(X_scaled)[0]
        segment = self.segment_labels[cluster]
        
        # Get churn prediction
        churn_proba = self.xgb_model.predict_proba(X)[:, 1][0]
        churn_prediction = int(churn_proba > 0.5)
        
        return {
            'churn_probability': float(churn_proba),
            'churn_prediction': churn_prediction,
            'cluster': int(cluster),
            'segment': segment
        }


def train_complete_pipeline(csv_path, n_trials=10, save_dir='models'):
    """
    Complete training workflow:
    1. Load data
    2. Preprocess
    3. Fit K-Means clustering
    4. Train XGBoost
    5. Save pipeline
    """
    print("=" * 60)
    print("CUSTOMER CHURN PREDICTION PIPELINE")
    print("=" * 60)
    
    # Load data
    print(f"\nLoading data from: {csv_path}")
    df = pd.read_csv(csv_path, delimiter='\t')
    print(f"Loaded {len(df)} customers with {len(df.columns)} features")
    
    # Initialize pipeline
    pipeline = CustomerSegmentationPipeline(n_clusters=3, random_state=42)
    
    # Preprocess
    print("\nPreprocessing data...")
    df_processed = pipeline.preprocess_data(df, fit=True)
    
    # Separate features and target
    X = df_processed.drop(['Response'], axis=1)
    y = df_processed['Response']
    
    # Remove ID column if present
    if 'ID' in X.columns:
        X = X.drop('ID', axis=1)
    
    pipeline.feature_names = X.columns.tolist()
    
    # Fit clustering
    clusters = pipeline.fit_clustering(X)
    
    # Add cluster as feature for XGBoost
    X['Cluster'] = clusters
    
    # Train XGBoost
    study, X_test, y_test = pipeline.fit_xgboost(X, y, n_trials=n_trials)
    
    # Save pipeline
    pipeline_path = pipeline.save_pipeline(save_dir=save_dir)
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    
    return pipeline, study, X_test, y_test


if __name__ == "__main__":
    # Example usage
    pipeline, study, X_test, y_test = train_complete_pipeline(
        csv_path='artifacts/customers.csv',
        n_trials=10,
        save_dir='models'
    )
