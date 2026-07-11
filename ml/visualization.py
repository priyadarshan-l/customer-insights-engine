"""
Visualization utilities for Customer Churn Analysis
Modularized plotting functions for clean notebooks
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from pathlib import Path
import shap

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)
plt.rcParams['font.size'] = 10

ASSETS_DIR = Path(__file__).parent / "assets"
ASSETS_DIR.mkdir(exist_ok=True)


def plot_cluster_distribution(labels, segment_names, save_path=None):
    """Plot cluster distribution with segment names"""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    unique, counts = np.unique(labels, return_counts=True)
    colors = ['#3498db', '#e74c3c', '#2ecc71']
    
    bars = ax.bar(range(len(unique)), counts, color=colors, alpha=0.8, edgecolor='black')
    ax.set_xlabel('Customer Segment', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of Customers', fontsize=12, fontweight='bold')
    ax.set_title('Customer Segmentation Distribution', fontsize=14, fontweight='bold', pad=20)
    ax.set_xticks(range(len(unique)))
    ax.set_xticklabels(segment_names, fontsize=11)
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}',
                ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    return fig


def plot_cluster_pca(X_scaled, labels, segment_names, save_path=None):
    """Plot PCA visualization of clusters"""
    from sklearn.decomposition import PCA
    
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    
    fig, ax = plt.subplots(figsize=(12, 8))
    colors = ['#3498db', '#e74c3c', '#2ecc71']
    
    for i, (label, color) in enumerate(zip(np.unique(labels), colors)):
        mask = labels == label
        ax.scatter(X_pca[mask, 0], X_pca[mask, 1], 
                  c=color, label=segment_names[i], 
                  alpha=0.6, s=50, edgecolors='black', linewidth=0.5)
    
    ax.set_xlabel(f'PC1 ({pca.explained_variance_ratio_[0]:.1%} variance)', 
                  fontsize=12, fontweight='bold')
    ax.set_ylabel(f'PC2 ({pca.explained_variance_ratio_[1]:.1%} variance)', 
                  fontsize=12, fontweight='bold')
    ax.set_title('Customer Segments - PCA Visualization', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.legend(fontsize=11, frameon=True, shadow=True)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    return fig


def plot_confusion_matrix(y_true, y_pred, save_path=None):
    """Plot confusion matrix"""
    from sklearn.metrics import confusion_matrix
    
    cm = confusion_matrix(y_true, y_pred)
    
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                cbar_kws={'label': 'Count'}, ax=ax,
                annot_kws={'size': 14, 'weight': 'bold'})
    
    ax.set_xlabel('Predicted Label', fontsize=12, fontweight='bold')
    ax.set_ylabel('True Label', fontsize=12, fontweight='bold')
    ax.set_title('Confusion Matrix - Churn Prediction', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.set_xticklabels(['No Churn', 'Churn'], fontsize=11)
    ax.set_yticklabels(['No Churn', 'Churn'], fontsize=11)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    return fig


def plot_feature_importance(model, feature_names, top_n=15, save_path=None):
    """Plot XGBoost feature importance"""
    importance = model.feature_importances_
    indices = np.argsort(importance)[-top_n:]
    
    fig, ax = plt.subplots(figsize=(10, 8))
    colors = plt.cm.viridis(np.linspace(0.3, 0.9, len(indices)))
    
    ax.barh(range(len(indices)), importance[indices], color=colors, edgecolor='black')
    ax.set_yticks(range(len(indices)))
    ax.set_yticklabels([feature_names[i] for i in indices], fontsize=10)
    ax.set_xlabel('Feature Importance', fontsize=12, fontweight='bold')
    ax.set_title(f'Top {top_n} Most Important Features', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        # Also save as CSV
        csv_path = save_path.replace('.png', '.csv')
        importance_df = pd.DataFrame({
            'Feature': feature_names,
            'Importance': importance
        }).sort_values('Importance', ascending=False)
        importance_df.to_csv(csv_path, index=False)
        print(f"✓ Saved: {save_path}")
        print(f"✓ Saved: {csv_path}")
    
    plt.show()
    return fig


def plot_shap_summary(shap_values, X, save_path=None):
    """Plot SHAP summary plot"""
    fig, ax = plt.subplots(figsize=(12, 8))
    shap.summary_plot(shap_values, X, show=False, plot_size=(12, 8))
    plt.title('SHAP Summary Plot - Feature Impact on Predictions', 
              fontsize=14, fontweight='bold', pad=20)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    return fig


def plot_shap_bar(shap_values, X, save_path=None):
    """Plot SHAP bar plot"""
    fig, ax = plt.subplots(figsize=(10, 8))
    shap.summary_plot(shap_values, X, plot_type="bar", show=False)
    plt.title('SHAP Feature Importance (Mean Absolute Impact)', 
              fontsize=14, fontweight='bold', pad=20)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    return fig


def plot_shap_waterfall(explainer, shap_values, X, sample_idx=0, save_path=None):
    """Plot SHAP waterfall for a single prediction"""
    fig, ax = plt.subplots(figsize=(10, 8))
    shap.plots.waterfall(shap_values[sample_idx], show=False)
    plt.title(f'SHAP Waterfall Plot - Sample {sample_idx}', 
              fontsize=14, fontweight='bold', pad=20)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    return fig


def plot_shap_dependence(shap_values, X, feature_name, save_path=None):
    """Plot SHAP dependence plot for a specific feature"""
    fig, ax = plt.subplots(figsize=(10, 6))
    shap.dependence_plot(feature_name, shap_values.values, X, show=False)
    plt.title(f'SHAP Dependence Plot - {feature_name}', 
              fontsize=14, fontweight='bold', pad=20)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    return fig


def plot_shap_force(explainer, shap_values, X, sample_idx=0, save_path=None):
    """Plot SHAP force plot for a single prediction"""
    fig = shap.force_plot(
        explainer.expected_value, 
        shap_values.values[sample_idx], 
        X.iloc[sample_idx],
        matplotlib=True,
        show=False
    )
    plt.title(f'SHAP Force Plot - Sample {sample_idx}', 
              fontsize=14, fontweight='bold', pad=20)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    return fig


def save_all_shap_plots(explainer, shap_values, X, feature_names, assets_dir="src/assets"):
    """Generate and save all SHAP plots"""
    assets_path = Path(assets_dir)
    assets_path.mkdir(parents=True, exist_ok=True)
    
    print("\n📊 Generating SHAP Visualizations...")
    print("=" * 60)
    
    # Summary plot
    plot_shap_summary(shap_values, X, save_path=str(assets_path / "shap_summary_beeswarm.png"))
    
    # Bar plot
    plot_shap_bar(shap_values, X, save_path=str(assets_path / "shap_bar.png"))
    
    # Waterfall for first sample
    plot_shap_waterfall(explainer, shap_values, X, sample_idx=0, 
                       save_path=str(assets_path / "shap_waterfall_sample0.png"))
    
    # Dependence plot for top feature
    top_feature = feature_names[0]  # Assuming sorted by importance
    plot_shap_dependence(shap_values, X, top_feature, 
                        save_path=str(assets_path / f"shap_dependence_{top_feature}.png"))
    
    # Force plot
    plot_shap_force(explainer, shap_values, X, sample_idx=0,
                   save_path=str(assets_path / "shap_force_plot.png"))
    
    print("=" * 60)
    print("✅ All SHAP plots saved successfully!\n")


def plot_cluster_tsne(X_scaled, labels, segment_names, save_path=None):
    """Plot t-SNE visualization of clusters"""
    from sklearn.manifold import TSNE
    
    print("Computing t-SNE embedding (this may take a moment)...")
    tsne = TSNE(n_components=2, random_state=42, perplexity=30, max_iter=1000)
    X_tsne = tsne.fit_transform(X_scaled)
    
    fig, ax = plt.subplots(figsize=(12, 8))
    colors = ['#3498db', '#e74c3c', '#2ecc71']
    
    for i, (label, color) in enumerate(zip(np.unique(labels), colors)):
        mask = labels == label
        ax.scatter(X_tsne[mask, 0], X_tsne[mask, 1], 
                  c=color, label=segment_names[i], 
                  alpha=0.6, s=50, edgecolors='black', linewidth=0.5)
    
    ax.set_xlabel('t-SNE Component 1', fontsize=12, fontweight='bold')
    ax.set_ylabel('t-SNE Component 2', fontsize=12, fontweight='bold')
    ax.set_title('Customer Segments - t-SNE Visualization', 
                 fontsize=14, fontweight='bold', pad=20)
    ax.legend(fontsize=11, frameon=True, shadow=True)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    print("✓ t-SNE computation complete!")
    return fig


def plot_dimensionality_comparison(X_scaled, labels, segment_names, save_path=None):
    """Plot side-by-side comparison of PCA and t-SNE"""
    from sklearn.decomposition import PCA
    from sklearn.manifold import TSNE
    
    # Compute both embeddings
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    
    print("Computing t-SNE embedding (this may take a moment)...")
    tsne = TSNE(n_components=2, random_state=42, perplexity=30, max_iter=1000)
    X_tsne = tsne.fit_transform(X_scaled)
    
    # Create side-by-side plot
    fig, axes = plt.subplots(1, 2, figsize=(18, 7))
    colors = ['#3498db', '#e74c3c', '#2ecc71']
    
    # PCA plot
    for i, (label, color) in enumerate(zip(np.unique(labels), colors)):
        mask = labels == label
        axes[0].scatter(X_pca[mask, 0], X_pca[mask, 1], 
                       c=color, label=segment_names[i], 
                       alpha=0.6, s=50, edgecolors='black', linewidth=0.5)
    
    axes[0].set_xlabel(f'PC1 ({pca.explained_variance_ratio_[0]:.1%} variance)', 
                      fontsize=12, fontweight='bold')
    axes[0].set_ylabel(f'PC2 ({pca.explained_variance_ratio_[1]:.1%} variance)', 
                      fontsize=12, fontweight='bold')
    axes[0].set_title('PCA - Linear Dimensionality Reduction', 
                     fontsize=13, fontweight='bold', pad=15)
    axes[0].legend(fontsize=10, frameon=True, shadow=True)
    axes[0].grid(True, alpha=0.3)
    
    # t-SNE plot
    for i, (label, color) in enumerate(zip(np.unique(labels), colors)):
        mask = labels == label
        axes[1].scatter(X_tsne[mask, 0], X_tsne[mask, 1], 
                       c=color, label=segment_names[i], 
                       alpha=0.6, s=50, edgecolors='black', linewidth=0.5)
    
    axes[1].set_xlabel('t-SNE Component 1', fontsize=12, fontweight='bold')
    axes[1].set_ylabel('t-SNE Component 2', fontsize=12, fontweight='bold')
    axes[1].set_title('t-SNE - Non-linear Dimensionality Reduction', 
                     fontsize=13, fontweight='bold', pad=15)
    axes[1].legend(fontsize=10, frameon=True, shadow=True)
    axes[1].grid(True, alpha=0.3)
    
    plt.suptitle('Dimensionality Reduction Comparison', 
                fontsize=15, fontweight='bold', y=1.02)
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"✓ Saved: {save_path}")
    
    plt.show()
    print("✓ Dimensionality reduction comparison complete!")
    return fig
