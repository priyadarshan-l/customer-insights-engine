import pytest
import pandas as pd
import numpy as np
from ml.preprocessing import FeatureEngineer, CampaignScoreAdder, SegmentEncoder

@pytest.fixture
def sample_customer_data():
    """Fixture providing a mock customer DataFrame with typical fields"""
    return pd.DataFrame({
        'Year_Birth': [1980, 1990, 1890],  # 1890 will test age clipping
        'Dt_Customer': ['01-01-2012', '15-06-2013', '30-11-2014'],
        'MntWines': [100.0, 50.0, 0.0],
        'MntFruits': [10.0, 0.0, 5.0],
        'MntMeatProducts': [200.0, 10.0, 0.0],
        'MntFishProducts': [20.0, 0.0, 0.0],
        'MntSweetProducts': [30.0, 5.0, 10.0],
        'MntGoldProds': [50.0, 15.0, 2.0],
        'NumWebPurchases': [5, 0, 2],
        'NumCatalogPurchases': [3, 0, 1],
        'NumStorePurchases': [8, 1, 0],
        'NumDealsPurchases': [1, 2, 0],
        'Kidhome': [1, 0, 0],
        'Teenhome': [0, 1, 0],
        'NumWebVisitsMonth': [7, 5, 2],
        'AcceptedCmp1': [1, 0, 0],
        'AcceptedCmp2': [0, 0, 0],
        'AcceptedCmp3': [0, 1, 0],
        'AcceptedCmp4': [0, 0, 0],
        'AcceptedCmp5': [1, 0, 0],
        'Response': [1, 0, 0]
    })

def test_feature_engineer_spent_purchases(sample_customer_data):
    """Test that FeatureEngineer correctly sums spending and purchases"""
    fe = FeatureEngineer(reference_date='2014-12-31')
    transformed = fe.fit_transform(sample_customer_data)
    
    # Check TotalSpent
    # Row 0: 100 + 10 + 200 + 20 + 30 + 50 = 410.0
    # Row 1: 50 + 0 + 10 + 0 + 5 + 15 = 80.0
    # Row 2: 0 + 5 + 0 + 0 + 10 + 2 = 17.0
    assert transformed.loc[0, 'TotalSpent'] == 410.0
    assert transformed.loc[1, 'TotalSpent'] == 80.0
    assert transformed.loc[2, 'TotalSpent'] == 17.0
    
    # Check TotalPurchases
    # Row 0: 5 + 3 + 8 + 1 = 17
    # Row 1: 0 + 0 + 1 + 2 = 3
    # Row 2: 2 + 1 + 0 + 0 = 3
    assert transformed.loc[0, 'TotalPurchases'] == 17
    assert transformed.loc[1, 'TotalPurchases'] == 3
    assert transformed.loc[2, 'TotalPurchases'] == 3
    
    # Check AvgPurchaseValue
    assert transformed.loc[0, 'AvgPurchaseValue'] == pytest.approx(410.0 / 17)
    assert transformed.loc[1, 'AvgPurchaseValue'] == pytest.approx(80.0 / 3)
    assert transformed.loc[2, 'AvgPurchaseValue'] == pytest.approx(17.0 / 3)

def test_feature_engineer_age_clipping(sample_customer_data):
    """Test that FeatureEngineer clips age to realistic ranges"""
    fe = FeatureEngineer(reference_date='2014-12-31')
    transformed = fe.fit_transform(sample_customer_data)
    
    # Reference year is 2014
    # Row 0: 2014 - 1980 = 34
    # Row 1: 2014 - 1990 = 24
    # Row 2: 2014 - 1890 = 124 -> clipped to 100
    assert transformed.loc[0, 'Age'] == 34
    assert transformed.loc[1, 'Age'] == 24
    assert transformed.loc[2, 'Age'] == 100

def test_feature_engineer_tenure(sample_customer_data):
    """Test that FeatureEngineer correctly calculates tenure in days"""
    fe = FeatureEngineer(reference_date='2014-12-31')
    transformed = fe.fit_transform(sample_customer_data)
    
    # Row 0: 01-01-2012 to 31-12-2014
    expected_days = (pd.to_datetime('2014-12-31') - pd.to_datetime('01-01-2012', dayfirst=True)).days
    assert transformed.loc[0, 'CustomerTenure'] == expected_days

def test_feature_engineer_has_kids(sample_customer_data):
    """Test that FeatureEngineer correctly computes HasKids flag"""
    fe = FeatureEngineer(reference_date='2014-12-31')
    transformed = fe.fit_transform(sample_customer_data)
    
    assert transformed.loc[0, 'HasKids'] == 1  # Kidhome=1, Teenhome=0
    assert transformed.loc[1, 'HasKids'] == 1  # Kidhome=0, Teenhome=1
    assert transformed.loc[2, 'HasKids'] == 0  # Kidhome=0, Teenhome=0

def test_campaign_score_adder(sample_customer_data):
    """Test that CampaignScoreAdder sums campaign acceptances correctly"""
    adder = CampaignScoreAdder()
    transformed = adder.fit_transform(sample_customer_data)
    
    # Row 0: AcceptedCmp1=1, AcceptedCmp3=0, AcceptedCmp5=1 -> CampaignScore=2
    # Row 1: AcceptedCmp1=0, AcceptedCmp3=1, AcceptedCmp5=0 -> CampaignScore=1
    # Row 2: All 0 -> CampaignScore=0
    assert transformed.loc[0, 'CampaignScore'] == 2
    assert transformed.loc[1, 'CampaignScore'] == 1
    assert transformed.loc[2, 'CampaignScore'] == 0

def test_segment_encoder(sample_customer_data):
    """Test that SegmentEncoder maps categories to integers cleanly"""
    df = sample_customer_data.copy()
    df['Segment'] = ['High Engagement', 'Low Engagement', 'Promo Sensitive']
    
    encoder = SegmentEncoder()
    transformed = encoder.fit_transform(df)
    
    # Segment column should be dropped, replaced by segment_encoded
    assert 'Segment' not in transformed.columns
    assert 'segment_encoded' in transformed.columns
    
    # Order should be alphabetically sorted unique values:
    # High Engagement -> 0
    # Low Engagement -> 1
    # Promo Sensitive -> 2
    assert transformed.loc[0, 'segment_encoded'] == 0
    assert transformed.loc[1, 'segment_encoded'] == 1
    assert transformed.loc[2, 'segment_encoded'] == 2
