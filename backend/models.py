"""
Pydantic models for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict


class CustomerInput(BaseModel):
    """
    Customer data input for churn prediction
    Uses top 10 most important features from SHAP analysis
    """
    # Top SHAP features
    Recency: int = Field(..., description="Days since last purchase", ge=0)
    MntMeatProducts: float = Field(..., description="Amount spent on meat products", ge=0)
    NumWebVisitsMonth: int = Field(..., description="Number of web visits per month", ge=0)
    Marital_Status: str = Field(..., description="Marital status (e.g., Married, Single)")
    Education: str = Field(..., description="Education level (e.g., PhD, Graduate)")
    MntGoldProds: float = Field(..., description="Amount spent on gold products", ge=0)
    NumStorePurchases: int = Field(..., description="Number of store purchases", ge=0)
    MntWines: float = Field(..., description="Amount spent on wines", ge=0)
    Teenhome: int = Field(..., description="Number of teenagers at home", ge=0)
    
    # Campaign features (for CampaignScore calculation)
    AcceptedCmp1: int = Field(0, description="Accepted campaign 1", ge=0, le=1)
    AcceptedCmp2: int = Field(0, description="Accepted campaign 2", ge=0, le=1)
    AcceptedCmp3: int = Field(0, description="Accepted campaign 3", ge=0, le=1)
    AcceptedCmp4: int = Field(0, description="Accepted campaign 4", ge=0, le=1)
    AcceptedCmp5: int = Field(0, description="Accepted campaign 5", ge=0, le=1)
    
    # Additional features (can use defaults)
    Year_Birth: int = Field(1970, description="Year of birth")
    Income: float = Field(50000, description="Annual income")
    Kidhome: int = Field(0, description="Number of kids at home", ge=0)
    MntFruits: float = Field(0, description="Amount spent on fruits", ge=0)
    MntFishProducts: float = Field(0, description="Amount spent on fish", ge=0)
    MntSweetProducts: float = Field(0, description="Amount spent on sweets", ge=0)
    NumDealsPurchases: int = Field(0, description="Number of deal purchases", ge=0)
    NumWebPurchases: int = Field(0, description="Number of web purchases", ge=0)
    NumCatalogPurchases: int = Field(0, description="Number of catalog purchases", ge=0)
    Complain: int = Field(0, description="Complaint filed", ge=0, le=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "Recency": 30,
                "MntMeatProducts": 200.0,
                "NumWebVisitsMonth": 5,
                "Marital_Status": "Married",
                "Education": "Graduate",
                "MntGoldProds": 50.0,
                "NumStorePurchases": 8,
                "MntWines": 300.0,
                "Teenhome": 1,
                "AcceptedCmp1": 0,
                "AcceptedCmp2": 0,
                "AcceptedCmp3": 1,
                "AcceptedCmp4": 0,
                "AcceptedCmp5": 0
            }
        }


class PredictionResponse(BaseModel):
    """Response model for churn prediction"""
    churn_probability: float = Field(..., description="Probability of churn (0-1)")
    churn_prediction: int = Field(..., description="Binary churn prediction (0=Stay, 1=Churn)")
    risk_level: str = Field(..., description="Risk classification (STABLE, MONITOR, URGENT)")
    segment: str = Field(..., description="Customer segment")
    cluster: int = Field(..., description="Cluster ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "churn_probability": 0.73,
                "churn_prediction": 1,
                "risk_level": "URGENT",
                "segment": "Low Engagement",
                "cluster": 0
            }
        }


class SegmentStats(BaseModel):
    """Statistics for a customer segment"""
    count: int
    churn_rate: float
    avg_value: float


class MetricsResponse(BaseModel):
    """Global metrics response"""
    total_customers: int
    churn_rate: float
    model_accuracy: float  # Changed from model_precision to match frontend
    segments: Dict[str, SegmentStats]  # Nested structure with detailed stats
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_customers": 2240,
                "churn_rate": 0.15,
                "model_accuracy": 0.877,
                "segments": {
                    "Low Engagement": {
                        "count": 750,
                        "churn_rate": 0.25,
                        "avg_value": 350.0
                    },
                    "High Engagement": {
                        "count": 890,
                        "churn_rate": 0.08,
                        "avg_value": 850.0
                    },
                    "Promo Sensitive": {
                        "count": 600,
                        "churn_rate": 0.15,
                        "avg_value": 520.0
                    }
                }
            }
        }
