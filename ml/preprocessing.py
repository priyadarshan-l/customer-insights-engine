import pandas as pd
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from imblearn.over_sampling import SMOTE
from datetime import datetime

class FeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Creates powerful engineered features based on domain knowledge and SHAP analysis.
    
    Features created:
    1. TotalSpent - Sum of all spending categories
    2. TotalPurchases - Sum of all purchase channels
    3. AvgPurchaseValue - Average value per purchase
    4. Age - Derived from Year_Birth
    5. CustomerTenure - Days since becoming customer
    6. HasKids - Binary flag for having children
    7. WebVisitToPurchaseRatio - Browsing efficiency
    8. PremiumProductRatio - Preference for premium products
    """
    
    def __init__(self, reference_date='2014-12-31'):
        self.reference_date = pd.to_datetime(reference_date)
        self.median_tenure_ = None  # Store median tenure for missing values
    
    def fit(self, X, y=None):
        if 'Dt_Customer' in X.columns:
            X_temp = X.copy()
            X_temp['Dt_Customer_parsed'] = pd.to_datetime(X_temp['Dt_Customer'], format='%d-%m-%Y', errors='coerce')
            X_temp['CustomerTenure'] = (self.reference_date - X_temp['Dt_Customer_parsed']).dt.days
            self.median_tenure_ = X_temp['CustomerTenure'].median()
        else:
            self.median_tenure_ = 730  # Default to 2 years if no data
        return self
    
    def transform(self, X):
        X = X.copy()
        
        # 1. TotalSpent - Sum of all product spending
        spending_cols = ['MntWines', 'MntFruits', 'MntMeatProducts', 
                        'MntFishProducts', 'MntSweetProducts', 'MntGoldProds']
        available_spending = [col for col in spending_cols if col in X.columns]
        if available_spending:
            X['TotalSpent'] = X[available_spending].sum(axis=1)
        else:
            X['TotalSpent'] = 0
        
        # 2. TotalPurchases - Sum of all purchase channels
        purchase_cols = ['NumWebPurchases', 'NumCatalogPurchases', 
                        'NumStorePurchases', 'NumDealsPurchases']
        available_purchases = [col for col in purchase_cols if col in X.columns]
        if available_purchases:
            X['TotalPurchases'] = X[available_purchases].sum(axis=1)
        else:
            X['TotalPurchases'] = 0
        
        # 3. AvgPurchaseValue - Customer value per transaction
        X['AvgPurchaseValue'] = np.where(
            X['TotalPurchases'] > 0,
            X['TotalSpent'] / X['TotalPurchases'],
            0
        )
        
        # 4. Age - Derived from Year_Birth
        if 'Year_Birth' in X.columns:
            current_year = self.reference_date.year
            X['Age'] = current_year - X['Year_Birth']
            # Handle outliers (age should be reasonable)
            X['Age'] = X['Age'].clip(18, 100)
        else:
            X['Age'] = 45
        
        # 5. CustomerTenure - Days since becoming customer
        if 'Dt_Customer' in X.columns:
            X['Dt_Customer_parsed'] = pd.to_datetime(X['Dt_Customer'], format='%d-%m-%Y', errors='coerce')
            X['CustomerTenure'] = (self.reference_date - X['Dt_Customer_parsed']).dt.days
            X['CustomerTenure'] = X['CustomerTenure'].fillna(self.median_tenure_ if self.median_tenure_ is not None else 730)
            X = X.drop(columns=['Dt_Customer_parsed'])
        else:
            X['CustomerTenure'] = self.median_tenure_ if self.median_tenure_ is not None else 730
        
        # 6. HasKids - Binary flag for having children
        if 'Kidhome' in X.columns and 'Teenhome' in X.columns:
            X['HasKids'] = ((X['Kidhome'] > 0) | (X['Teenhome'] > 0)).astype(int)
        elif 'Teenhome' in X.columns:
            X['HasKids'] = (X['Teenhome'] > 0).astype(int)
        elif 'Kidhome' in X.columns:
            X['HasKids'] = (X['Kidhome'] > 0).astype(int)
        else:
            X['HasKids'] = 0
        
        # 7. WebVisitToPurchaseRatio - Browsing vs buying efficiency
        if 'NumWebVisitsMonth' in X.columns and 'NumWebPurchases' in X.columns:
            X['WebVisitToPurchaseRatio'] = np.where(
                X['NumWebPurchases'] > 0,
                X['NumWebVisitsMonth'] / X['NumWebPurchases'],
                X['NumWebVisitsMonth']  # High ratio = browsing but not buying
            )
        else:
            X['WebVisitToPurchaseRatio'] = 0
        
        # 8. PremiumProductRatio - Preference for premium products (Wines + Meat)
        if 'MntWines' in X.columns and 'MntMeatProducts' in X.columns and 'TotalSpent' in X.columns:
            X['PremiumProductRatio'] = np.where(
                X['TotalSpent'] > 0,
                (X['MntWines'] + X['MntMeatProducts']) / X['TotalSpent'],
                0
            )
        else:
            X['PremiumProductRatio'] = 0
        
        print(f"✓ FeatureEngineer created 8 powerful features")
        return X


class SegmentEncoder(BaseEstimator, TransformerMixin):
    """
    Encodes customer segments into numeric values and drops the original Segment column.
    Handles both 'Segment' and 'Cluster' column names.
    """
    def __init__(self):
        self.segment_mapping_ = None
    
    def fit(self, X, y=None):
        """Learn the segment encoding mapping"""
        X = X.copy()
        
        segment_col = None
        if 'Segment' in X.columns:
            segment_col = 'Segment'
        elif 'Cluster' in X.columns:
            segment_col = 'Cluster'
        else:
            raise ValueError("Neither 'Segment' nor 'Cluster' column found in data!")
        
        # Create mapping from unique segments to integers
        unique_segments = X[segment_col].unique()
        self.segment_mapping_ = {seg: idx for idx, seg in enumerate(sorted(unique_segments))}
        
        print(f"✓ SegmentEncoder fitted with mapping: {self.segment_mapping_}")
        return self
    
    def transform(self, X):
        """Transform segments to numeric encoding"""
        X = X.copy()
        
        segment_col = None
        if 'Segment' in X.columns:
            segment_col = 'Segment'
        elif 'Cluster' in X.columns:
            segment_col = 'Cluster'
        else:
            raise ValueError("Neither 'Segment' nor 'Cluster' column found in data!")
        
        # Encode segments
        X['segment_encoded'] = X[segment_col].map(self.segment_mapping_)
        
        # Check for unmapped values
        if X['segment_encoded'].isna().any():
            unmapped = X[X['segment_encoded'].isna()][segment_col].unique()
            raise ValueError(f"Found unmapped segments: {unmapped}. Known segments: {list(self.segment_mapping_.keys())}")
        
        # Drop original segment column
        X = X.drop(columns=[segment_col])
        
        return X


class CampaignScoreAdder(BaseEstimator, TransformerMixin):
    """
    Creates a CampaignScore feature by summing all campaign acceptance columns.
    This is the 2nd most important feature according to SHAP analysis.
    """
    def __init__(self):
        self.campaign_cols_ = None
    
    def fit(self, X, y=None):
        """Identify campaign columns"""
        # Find all campaign acceptance columns
        self.campaign_cols_ = [col for col in X.columns if col.startswith('AcceptedCmp')]
        
        if not self.campaign_cols_:
            print("⚠️  Warning: No campaign columns found (AcceptedCmp*)")
        else:
            print(f"✓ CampaignScoreAdder found {len(self.campaign_cols_)} campaign columns")
        
        return self
    
    def transform(self, X):
        """Add CampaignScore feature"""
        X = X.copy()
        
        if self.campaign_cols_:
            # Verify all campaign columns exist
            missing_cols = [col for col in self.campaign_cols_ if col not in X.columns]
            if missing_cols:
                raise ValueError(f"Missing campaign columns in transform: {missing_cols}")
            
            # Sum campaign acceptances (SHAP shows this is critical!)
            X['CampaignScore'] = X[self.campaign_cols_].sum(axis=1)
        else:
            # If no campaign columns, set score to 0
            X['CampaignScore'] = 0
        
        return X


def load_data(csv_path, delimiter=','):
    """
    Load customer data from CSV file.
    
    Args:
        csv_path: Path to CSV file
        delimiter: CSV delimiter (default: ',')
    
    Returns:
        DataFrame with loaded data
    """
    print(f"Loading data from: {csv_path}")
    df = pd.read_csv(csv_path, delimiter=delimiter)
    print(f"✓ Loaded {len(df)} rows and {len(df.columns)} columns")
    return df


def split_and_oversample(X_train, y_train, random_state=42):
    """
    Apply SMOTE oversampling to balance the training data.
    
    Args:
        X_train: Training features
        y_train: Training labels
        random_state: Random seed
    
    Returns:
        X_resampled, y_resampled: Balanced training data
    """
    print(f"Original class distribution: {pd.Series(y_train).value_counts().to_dict()}")
    
    smote = SMOTE(random_state=random_state)
    X_resampled, y_resampled = smote.fit_resample(X_train, y_train)
    
    print(f"✓ After SMOTE: {pd.Series(y_resampled).value_counts().to_dict()}")
    
    return X_resampled, y_resampled
