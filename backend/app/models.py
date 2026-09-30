from pydantic import BaseModel
from typing import List, Optional

class Medicine(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: str = "General"
    dosage_form: str = "Tablet"
    rating: float = 4.8
    reviews_count: int = 120
    badge: Optional[str] = None
    in_stock: bool = True
    dosage_guidance: Optional[str] = "Take as directed on packaging or by physician"
    image_url: Optional[str] = None

class SymptomRequest(BaseModel):
    symptoms: str

class RecommendationResponse(BaseModel):
    condition: str
    recommended_medicines: List[Medicine]

class AllergyResponse(BaseModel):
    detected_allergy: str
    syrup_recommendation: str
    other_medicines: List[Medicine]
