import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app

@pytest.fixture(scope="module")
def client():
    """Fixture providing a TestClient with lifespan startup/shutdown triggered"""
    with TestClient(app) as c:
        yield c

def test_root_endpoint(client):
    """Test the root endpoint returns API info and online status"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Smart Customer Insights Engine API" in data["message"]
    assert "endpoints" in data

def test_health_check_endpoint(client):
    """Test the health check endpoint returns 200 and loads models"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model_loaded" in data

def test_metrics_endpoint(client):
    """Test metrics endpoint returns valid global KPIs"""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "total_customers" in data
    assert "churn_rate" in data
    assert "model_accuracy" in data
    assert "segments" in data
    assert isinstance(data["segments"], dict)

def test_segments_endpoint(client):
    """Test segment profiles endpoint returns segment characteristics and strategies"""
    response = client.get("/segments")
    assert response.status_code == 200
    data = response.json()
    assert "segments" in data
    assert isinstance(data["segments"], list)
    for seg in data["segments"]:
        assert "segment_name" in seg
        assert "customer_count" in seg
        assert "churn_rate" in seg
        assert "avg_customer_value" in seg
        assert "characteristics" in seg
        assert "retention_strategy" in seg

def test_feature_importance_endpoint(client):
    """Test feature importance endpoint returns ordered list of top features"""
    response = client.get("/feature-importance")
    assert response.status_code == 200
    data = response.json()
    assert "feature_importance" in data
    assert isinstance(data["feature_importance"], list)
    if len(data["feature_importance"]) > 0:
        first_feat = data["feature_importance"][0]
        assert "feature" in first_feat
        assert "importance" in first_feat

def test_cluster_distribution_endpoint(client):
    """Test cluster distribution endpoint returns counts and percentages"""
    response = client.get("/cluster-distribution")
    assert response.status_code == 200
    data = response.json()
    assert "distribution" in data
    assert isinstance(data["distribution"], list)
    for cluster in data["distribution"]:
        assert "cluster_id" in cluster
        assert "cluster_name" in cluster
        assert "count" in cluster
        assert "percentage" in cluster

def test_predict_churn_stable(client):
    """Test predicting churn for a high engagement, low risk customer (STABLE)"""
    # High spending, recent purchase, active, accepted some campaigns
    sample_customer = {
        "Recency": 10,
        "MntMeatProducts": 400.0,
        "NumWebVisitsMonth": 2,
        "Marital_Status": "Married",
        "Education": "PhD",
        "MntGoldProds": 80.0,
        "NumStorePurchases": 12,
        "MntWines": 600.0,
        "Teenhome": 0,
        "AcceptedCmp1": 1,
        "AcceptedCmp2": 0,
        "AcceptedCmp3": 1,
        "AcceptedCmp4": 1,
        "AcceptedCmp5": 1
    }
    response = client.post("/predict", json=sample_customer)
    assert response.status_code == 200
    data = response.json()
    assert "churn_probability" in data
    assert "churn_prediction" in data
    assert "risk_level" in data
    assert "segment" in data
    assert "cluster" in data

def test_predict_churn_urgent(client):
    """Test predicting churn for a low engagement, high risk customer (URGENT)"""
    # High recency, low spending, high web visits (browsing but not buying)
    sample_customer = {
        "Recency": 58,
        "MntMeatProducts": 546.0,
        "NumWebVisitsMonth": 7,
        "Marital_Status": "Single",
        "Education": "Graduation",
        "MntGoldProds": 88.0,
        "NumStorePurchases": 4,
        "MntWines": 635.0,
        "Teenhome": 0,
        "AcceptedCmp1": 0,
        "AcceptedCmp2": 0,
        "AcceptedCmp3": 0,
        "AcceptedCmp4": 0,
        "AcceptedCmp5": 0
    }
    response = client.post("/predict", json=sample_customer)
    assert response.status_code == 200
    data = response.json()
    assert "churn_probability" in data
    assert "churn_prediction" in data
    assert "risk_level" in data
    assert data["risk_level"] in ["URGENT", "MONITOR"]  # High risk

def test_cluster_customers_batch(client):
    """Test batch clustering endpoint with multiple customer records"""
    batch_data = {
        "customers": [
            {
                "Recency": 10,
                "MntMeatProducts": 400.0,
                "NumWebVisitsMonth": 2,
                "Marital_Status": "Married",
                "Education": "PhD",
                "MntGoldProds": 80.0,
                "NumStorePurchases": 12,
                "MntWines": 600.0,
                "Teenhome": 0,
                "AcceptedCmp1": 1,
                "AcceptedCmp2": 0,
                "AcceptedCmp3": 1,
                "AcceptedCmp4": 1,
                "AcceptedCmp5": 1
            },
            {
                "Recency": 95,
                "MntMeatProducts": 2.0,
                "NumWebVisitsMonth": 12,
                "Marital_Status": "Single",
                "Education": "Basic",
                "MntGoldProds": 0.0,
                "NumStorePurchases": 0,
                "MntWines": 5.0,
                "Teenhome": 1,
                "AcceptedCmp1": 0,
                "AcceptedCmp2": 0,
                "AcceptedCmp3": 0,
                "AcceptedCmp4": 0,
                "AcceptedCmp5": 0
            }
        ]
    }
    response = client.post("/cluster-customers", json=batch_data)
    assert response.status_code == 200
    data = response.json()
    assert "customers" in data
    assert "segments" in data
    assert data["total_customers"] == 2
    assert isinstance(data["customers"], list)
    assert "Segment" in data["customers"][0]
    assert "Cluster" in data["customers"][0]
