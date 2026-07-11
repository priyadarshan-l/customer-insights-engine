import shap
import matplotlib.pyplot as plt
import pandas as pd
import os

def generate_shap_visuals(pipeline, X_sample, output_dir="src/assets"):
    """
    Generate SHAP visualizations for model interpretability.
    
    Args:
        pipeline: Trained sklearn pipeline (preprocessing + model)
        X_sample: Sample data for SHAP analysis (unprocessed)
        output_dir: Directory to save plots (default: src/assets)
    
    Returns:
        feature_importance_df: DataFrame with feature importance scores
    """
    print("\n" + "="*60)
    print("GENERATING SHAP VISUALIZATIONS")
    print("="*60)
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Extract the model from pipeline
    if hasattr(pipeline, 'named_steps'):
        model = pipeline.named_steps['classifier']
        # Transform data through preprocessing steps
        X_processed = pipeline.named_steps['preprocessing'].transform(X_sample)
    else:
        model = pipeline
        X_processed = X_sample
    
    print(f"✓ Using {X_processed.shape[0]} samples for SHAP analysis")
    print(f"✓ Features: {list(X_processed.columns)}")
    
    # Create SHAP explainer
    print("\nCreating SHAP explainer...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_processed)
    
    plt.rcParams.update({
        'font.size': 11,
        'font.family': 'sans-serif',
        'axes.labelsize': 12,
        'axes.titlesize': 14,
        'xtick.labelsize': 10,
        'ytick.labelsize': 10,
        'figure.dpi': 100
    })
    
    # 1. Summary Plot (Bar)
    print("\n1. Generating summary plot (bar)...")
    plt.figure(figsize=(10, 8))
    shap.summary_plot(shap_values, X_processed, plot_type="bar", show=False)
    plt.title("Feature Importance (Mean |SHAP Value|)", fontsize=14, fontweight='bold', pad=20)
    plt.tight_layout()
    bar_path = os.path.join(output_dir, "shap_summary_bar.png")
    plt.savefig(bar_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Saved: {bar_path}")
    
    # 2. Summary Plot (Beeswarm)
    print("2. Generating summary plot (beeswarm)...")
    plt.figure(figsize=(10, 8))
    shap.summary_plot(shap_values, X_processed, show=False)
    plt.title("SHAP Summary Plot - Feature Impact on Predictions", fontsize=14, fontweight='bold', pad=20)
    plt.tight_layout()
    beeswarm_path = os.path.join(output_dir, "shap_summary_beeswarm.png")
    plt.savefig(beeswarm_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Saved: {beeswarm_path}")
    
    # 3. Force Plot (for first prediction)
    print("3. Generating force plot...")
    try:
        shap.force_plot(
            explainer.expected_value,
            shap_values[0, :],
            X_processed.iloc[0, :],
            matplotlib=True,
            show=False
        )
        plt.title("SHAP Force Plot - Individual Prediction Explanation", fontsize=14, fontweight='bold', pad=20)
        plt.tight_layout()
        force_path = os.path.join(output_dir, "shap_force_plot.png")
        plt.savefig(force_path, dpi=300, bbox_inches='tight')
        plt.close()
        print(f"✓ Saved: {force_path}")
    except Exception as e:
        print(f"⚠️  Could not generate force plot: {e}")
    
    # 4. Feature Importance DataFrame
    print("\n4. Creating feature importance dataframe...")
    feature_importance = pd.DataFrame({
        'feature': X_processed.columns,
        'importance': abs(shap_values).mean(axis=0)
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10).to_string(index=False))
    
    # Save to CSV
    csv_path = os.path.join(output_dir, "feature_importance.csv")
    feature_importance.to_csv(csv_path, index=False)
    print(f"\n✓ Feature importance saved to: {csv_path}")
    
    print("\n" + "="*60)
    print("SHAP VISUALIZATION COMPLETE!")
    print("="*60)
    
    return feature_importance
