import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score
import xgboost as xgb
import optuna
from optuna.samplers import TPESampler

from ml.preprocessing import SegmentEncoder, CampaignScoreAdder, load_data, split_and_oversample

def train_and_save_pipeline(csv_path, model_path="models/churn_model_pipeline.pkl", n_trials=10, delimiter=','):
    """
    Complete training pipeline with Optuna hyperparameter tuning and model saving.
    
    Args:
        csv_path: Path to the labeled customer segments CSV
        model_path: Where to save the final model
        n_trials: Number of Optuna optimization trials
        delimiter: CSV delimiter
    
    Returns:
        final_pipeline: Trained pipeline
        study: Optuna study object
        X_train_orig: Original training data
        X_test: Test data
        y_test: Test labels
    """
    print("\n" + "="*60)
    print("STEP 1: Loading and preprocessing data")
    print("="*60)
    
    # Load data
    df = load_data(csv_path, delimiter=delimiter)
    
    if 'Cluster' in df.columns and 'Segment' not in df.columns:
        print("⚠️  Found 'Cluster' column, renaming to 'Segment' for consistency...")
        df = df.rename(columns={'Cluster': 'Segment'})
    
    # Verify Response column exists
    if 'Response' not in df.columns:
        raise ValueError("Target column 'Response' not found in dataset!")
    
    # Split features and target
    X = df.drop('Response', axis=1)
    y = df['Response']
    
    print(f"✓ Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")
    print(f"✓ Target distribution: {y.value_counts().to_dict()}")
    
    # Train-test split
    X_train_orig, X_test_orig, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Create preprocessing pipeline
    preprocessing_pipeline = Pipeline([
        ('segment_encoder', SegmentEncoder()),
        ('campaign_score', CampaignScoreAdder())
    ])
    
    # Fit and transform training data
    X_train_processed = preprocessing_pipeline.fit_transform(X_train_orig)
    X_test_processed = preprocessing_pipeline.transform(X_test_orig)
    
    print(f"✓ Preprocessing complete")
    print(f"✓ Training features: {X_train_processed.shape[1]}")
    print(f"✓ Feature names: {list(X_train_processed.columns)}")
    
    # Apply SMOTE to the PREPROCESSED data
    print("\n" + "="*60)
    print("STEP 3: Applying SMOTE oversampling")
    print("="*60)
    
    X_train_resampled, y_train_resampled = split_and_oversample(
        X_train_processed, y_train, random_state=42
    )
    
    print(f"✓ After oversampling: {X_train_resampled.shape[0]} training samples")
    
    print("\n" + "="*60)
    print("STEP 4: Hyperparameter tuning with Optuna")
    print("="*60)
    
    def objective(trial):
        """Optuna objective function for XGBoost hyperparameter tuning"""
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 100, 500),
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'gamma': trial.suggest_float('gamma', 0, 5),
            'reg_alpha': trial.suggest_float('reg_alpha', 0, 5),
            'reg_lambda': trial.suggest_float('reg_lambda', 0, 5),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'random_state': 42,
            'eval_metric': 'logloss'
        }
        
        model = xgb.XGBClassifier(**params)
        model.fit(X_train_resampled, y_train_resampled)
        
        y_pred_proba = model.predict_proba(X_test_processed)[:, 1]
        score = roc_auc_score(y_test, y_pred_proba)
        
        return score
    
    # Run Optuna optimization
    study = optuna.create_study(
        direction='maximize',
        sampler=TPESampler(seed=42)
    )
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
    
    print(f"\n✓ Best ROC-AUC: {study.best_value:.4f}")
    print(f"✓ Best parameters: {study.best_params}")
    
    print("\n" + "="*60)
    print("STEP 5: Training final model with best parameters")
    print("="*60)
    
    # Train final model with best parameters
    best_model = xgb.XGBClassifier(**study.best_params, random_state=42, eval_metric='logloss')
    best_model.fit(X_train_resampled, y_train_resampled)
    
    # Create final pipeline
    final_pipeline = Pipeline([
        ('preprocessing', preprocessing_pipeline),
        ('classifier', best_model)
    ])
    
    # Evaluate on test set
    y_pred = final_pipeline.predict(X_test_orig)
    y_pred_proba = final_pipeline.predict_proba(X_test_orig)[:, 1]
    
    print("\n✓ Test Set Performance:")
    print(classification_report(y_test, y_pred, target_names=['Stay', 'Churn']))
    print(f"✓ ROC-AUC Score: {roc_auc_score(y_test, y_pred_proba):.4f}")
    
    print("\n" + "="*60)
    print("STEP 6: Saving model")
    print("="*60)
    
    # Create models directory if it doesn't exist
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    # Save the model
    try:
        with open(model_path, 'wb') as f:
            pickle.dump(final_pipeline, f)
        
        # Verify the save
        file_size = os.path.getsize(model_path)
        if file_size > 0:
            print(f"✅ Model saved successfully to: {model_path}")
            print(f"✓ File size: {file_size / 1024:.2f} KB")
        else:
            raise ValueError("Saved file is empty!")
            
    except Exception as e:
        print(f"❌ Error saving model: {e}")
        print("⚠️  Attempting backup save with joblib...")
        
        import joblib
        backup_path = model_path.replace('.pkl', '_backup.joblib')
        joblib.dump(final_pipeline, backup_path)
        print(f"✅ Backup model saved to: {backup_path}")
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE!")
    print("="*60)
    
    return final_pipeline, study, X_train_orig, X_test_orig, y_test
