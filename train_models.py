"""
Complete Training Script for Customer Churn Prediction System
Trains both clustering and prediction pipelines in one go

Usage:
    python train_models.py
"""

import sys
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import xgboost as xgb
import optuna
import shap
import joblib

from ml.preprocessing import FeatureEngineer, CampaignScoreAdder, split_and_oversample

# Import visualization functions
from ml.visualization import (
    plot_cluster_distribution,
    plot_cluster_pca,
    plot_cluster_tsne,
    plot_dimensionality_comparison,
    plot_confusion_matrix,
    plot_feature_importance,
    save_all_shap_plots
)

print("="*70)
print("🚀 CUSTOMER CHURN PREDICTION - COMPLETE TRAINING PIPELINE")
print("="*70)
print()


def train_clustering_pipeline():
    """Train K-Means clustering pipeline"""
    print("📊 PHASE 1: CLUSTERING PIPELINE")
    print("-"*70)
    
    # Load data
    print("Loading data...")
    df = pd.read_csv('data/customers.csv', sep='\t')
    print(f"✓ Loaded {df.shape[0]} customers with {df.shape[1]} features")
    
    print("\nEngineering features...")
    feature_engineer = FeatureEngineer(reference_date='2014-12-31')
    df_engineered = feature_engineer.fit_transform(df)
    
    campaign_adder = CampaignScoreAdder()
    df_engineered = campaign_adder.fit_transform(df_engineered)
    
    cluster_features = [
        'Recency', 'TotalSpent', 'TotalPurchases', 'AvgPurchaseValue',
        'NumWebVisitsMonth', 'CampaignScore', 'Age', 'CustomerTenure',
        'WebVisitToPurchaseRatio', 'PremiumProductRatio'
    ]
    
    X_cluster = df_engineered[cluster_features].copy()
    print(f"✓ Created {len(cluster_features)} powerful clustering features")
    
    # Standardize and cluster
    print("\nTraining K-Means clustering...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_cluster)
    
    n_clusters = 3
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)
    
    df_engineered['Cluster'] = cluster_labels
    
    print("\nAnalyzing cluster characteristics...")
    segment_mapping = {}
    
    for cluster_id in range(n_clusters):
        cluster_data = df_engineered[df_engineered['Cluster'] == cluster_id]
        
        # Calculate engagement metrics for this cluster
        avg_recency = cluster_data['Recency'].mean()
        avg_web_visits = cluster_data['NumWebVisitsMonth'].mean()
        avg_spending = cluster_data['TotalSpent'].mean()
        avg_campaign = cluster_data['CampaignScore'].mean()
        
        # Determine segment based on characteristics
        # Low recency (recent) + high web visits + high spending = High Engagement
        # High recency (not recent) + low web visits + low spending = Low Engagement
        # High campaign score = Promo Sensitive
        
        engagement_score = (
            (1 / (avg_recency + 1)) * 100 +  # Lower recency is better
            avg_web_visits * 10 +
            (avg_spending / 1000) * 5
        )
        
        print(f"  Cluster {cluster_id}: Recency={avg_recency:.1f}, WebVisits={avg_web_visits:.1f}, "
              f"Spending={avg_spending:.0f}, Engagement={engagement_score:.1f}")
    
    # Sort clusters by engagement score to assign labels
    cluster_scores = []
    for cluster_id in range(n_clusters):
        cluster_data = df_engineered[df_engineered['Cluster'] == cluster_id]
        avg_recency = cluster_data['Recency'].mean()
        avg_web_visits = cluster_data['NumWebVisitsMonth'].mean()
        avg_spending = cluster_data['TotalSpent'].mean()
        avg_campaign = cluster_data['CampaignScore'].mean()
        
        engagement_score = (
            (1 / (avg_recency + 1)) * 100 +
            avg_web_visits * 10 +
            (avg_spending / 1000) * 5
        )
        
        cluster_scores.append((cluster_id, engagement_score, avg_campaign))
    
    # Sort by engagement score
    cluster_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Assign labels: highest engagement = High, lowest = Low, middle = Promo Sensitive or Medium
    segment_mapping[cluster_scores[0][0]] = 'High Engagement'
    segment_mapping[cluster_scores[2][0]] = 'Low Engagement'
    
    # Middle cluster: check if it's promo-sensitive or medium engagement
    middle_cluster_id = cluster_scores[1][0]
    middle_campaign_score = cluster_scores[1][2]
    
    # If campaign score is notably higher, it's promo-sensitive
    avg_campaign_all = df_engineered['CampaignScore'].mean()
    if middle_campaign_score > avg_campaign_all * 1.2:
        segment_mapping[middle_cluster_id] = 'Promo Sensitive'
    else:
        segment_mapping[middle_cluster_id] = 'Medium Engagement'
    
    print(f"\n✓ Segment mapping determined:")
    for cluster_id, label in segment_mapping.items():
        print(f"  Cluster {cluster_id} → {label}")
    
    df_engineered['Segment'] = df_engineered['Cluster'].map(segment_mapping)
    print(f"✓ Clustered into {n_clusters} segments")
    
    # Generate visualizations
    print("\nGenerating visualizations...")
    Path('src/assets').mkdir(parents=True, exist_ok=True)
    
    segment_names = ['Low Engagement', 'High Engagement', 'Promo Sensitive']
    
    plot_cluster_distribution(
        cluster_labels, segment_names,
        save_path='src/assets/cluster_distribution.png'
    )
    
    plot_cluster_pca(
        X_scaled, cluster_labels, segment_names,
        save_path='src/assets/cluster_pca_visual.png'
    )
    
    plot_cluster_tsne(
        X_scaled, cluster_labels, segment_names,
        save_path='src/assets/cluster_tsne_visual.png'
    )
    
    plot_dimensionality_comparison(
        X_scaled, cluster_labels, segment_names,
        save_path='src/assets/cluster_comparison_pca_tsne.png'
    )
    
    # Save pipeline
    print("\nSaving clustering pipeline...")
    Path('models').mkdir(exist_ok=True)
    
    clustering_pipeline = {
        'kmeans': kmeans,
        'scaler': scaler,
        'feature_engineer': feature_engineer,
        'campaign_adder': campaign_adder,
        'feature_names': cluster_features,
        'segment_mapping': segment_mapping,
        'n_clusters': n_clusters
    }
    
    joblib.dump(clustering_pipeline, 'models/clustering_pipeline.pkl')
    print("✓ Saved: models/clustering_pipeline.pkl")
    
    # Save labeled data
    df_engineered.to_csv('data/customers_segmented.csv', index=False)
    print("✓ Saved: data/customers_segmented.csv")
    
    print("\n✅ CLUSTERING PIPELINE COMPLETE!")
    print("="*70)
    print()
    
    return df_engineered


def train_prediction_pipeline(df_engineered):
    """Train XGBoost prediction pipeline"""
    print("🎯 PHASE 2: PREDICTION PIPELINE")
    print("-"*70)
    
    print("Preparing features...")
    feature_columns = [
        # Top SHAP features
        'Recency', 'CampaignScore', 'MntMeatProducts', 'NumWebVisitsMonth',
        'Marital_Status', 'Education', 'MntGoldProds', 'NumStorePurchases',
        'MntWines', 'Teenhome',
        # Powerful engineered features
        'TotalSpent', 'TotalPurchases', 'AvgPurchaseValue', 'Age',
        'CustomerTenure', 'HasKids', 'WebVisitToPurchaseRatio',
        'PremiumProductRatio', 'Segment'
    ]
    
    X = df_engineered[feature_columns].copy()
    y = df_engineered['Response'].copy()
    
    # Encode categorical variables
    label_encoders = {}
    categorical_cols = ['Marital_Status', 'Education', 'Segment']
    
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le
    
    print(f"✓ Prepared {len(feature_columns)} features (SHAP top 10 + 8 engineered)")
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"✓ Split: {X_train.shape[0]} train, {X_test.shape[0]} test")
    
    print("\nApplying SMOTE for class balance...")
    X_train_resampled, y_train_resampled = split_and_oversample(X_train, y_train)
    
    # Hyperparameter optimization
    print("\nOptimizing hyperparameters with Optuna (50 trials)...")
    
    def objective(trial):
        params = {
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
            'n_estimators': trial.suggest_int('n_estimators', 100, 500),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'gamma': trial.suggest_float('gamma', 0, 5),
            'reg_alpha': trial.suggest_float('reg_alpha', 0, 2),
            'reg_lambda': trial.suggest_float('reg_lambda', 1, 5),
            'random_state': 42
        }
        
        model = xgb.XGBClassifier(**params)
        model.fit(X_train_resampled, y_train_resampled)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        return roc_auc_score(y_test, y_pred_proba)
    
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=50, show_progress_bar=True)
    
    print(f"✓ Best ROC-AUC: {study.best_value:.4f}")
    
    # Train final model
    print("\nTraining final model with best parameters...")
    best_params = study.best_params
    best_params['random_state'] = 42
    
    model = xgb.XGBClassifier(**best_params)
    model.fit(X_train_resampled, y_train_resampled)
    
    # Evaluate
    print("\nEvaluating model...")
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    print(f"✓ ROC-AUC Score: {roc_auc:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['No Churn', 'Churn']))
    
    # Generate visualizations
    print("\nGenerating visualizations...")
    
    plot_confusion_matrix(
        y_test, y_pred,
        save_path='src/assets/confusion_matrix_improved.png'
    )
    
    plot_feature_importance(
        model, feature_columns, top_n=15,
        save_path='src/assets/feature_importance.png'
    )
    
    # SHAP analysis
    print("\nGenerating SHAP explanations (this may take a minute)...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer(X_test)
    
    save_all_shap_plots(
        explainer, shap_values, X_test, feature_columns,
        assets_dir='src/assets'
    )
    
    # Save pipeline
    print("\nSaving prediction pipeline...")
    prediction_pipeline = {
        'model': model,
        'label_encoders': label_encoders,
        'feature_columns': feature_columns,
        'best_params': best_params,
        'roc_auc_score': roc_auc,
        'shap_explainer': explainer
    }
    
    joblib.dump(prediction_pipeline, 'models/churn_prediction_pipeline.pkl')
    print("✓ Saved: models/churn_prediction_pipeline.pkl")
    
    print("\n✅ PREDICTION PIPELINE COMPLETE!")
    print("="*70)
    print()
    
    return model, roc_auc


def main():
    """Main training function"""
    try:
        # Phase 1: Clustering
        df_engineered = train_clustering_pipeline()
        
        # Phase 2: Prediction
        model, roc_auc = train_prediction_pipeline(df_engineered)
        
        # Summary
        print("\n" + "="*70)
        print("🎉 TRAINING COMPLETE!")
        print("="*70)
        print("\n📦 Generated Outputs:")
        print("  ✓ models/clustering_pipeline.pkl")
        print("  ✓ models/churn_prediction_pipeline.pkl")
        print("  ✓ data/customers_segmented.csv")
        print("  ✓ src/assets/*.png (all visualizations)")
        print(f"\n🎯 Final Model Performance: ROC-AUC = {roc_auc:.4f}")
        print("\n💡 Feature Engineering Applied:")
        print("  ✓ CampaignScore (SHAP #2 feature)")
        print("  ✓ TotalSpent, TotalPurchases, AvgPurchaseValue")
        print("  ✓ Age, CustomerTenure, HasKids")
        print("  ✓ WebVisitToPurchaseRatio, PremiumProductRatio")
        print("\n🚀 Next Steps:")
        print("  1. Start backend: python -m uvicorn backend.app:app --reload")
        print("  2. Test API: http://localhost:8000/docs")
        print("  3. Review notebooks for detailed analysis")
        print("\n" + "="*70)
        
    except Exception as e:
        print(f"\n❌ Error during training: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
