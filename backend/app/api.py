from fastapi import APIRouter, UploadFile, File
from typing import List
from .models import Medicine, SymptomRequest, RecommendationResponse, AllergyResponse
from .services import get_all_medicines, recommend_medicines_for_symptoms, analyze_skin_allergy_image

router = APIRouter()

@router.get("/medicines", response_model=List[Medicine])
def read_medicines():
    return get_all_medicines()

@router.post("/recommend", response_model=RecommendationResponse)
def get_recommendations(request: SymptomRequest):
    condition, meds = recommend_medicines_for_symptoms(request.symptoms)
    return RecommendationResponse(condition=condition, recommended_medicines=meds)

@router.post("/upload-allergy", response_model=AllergyResponse)
async def upload_allergy(file: UploadFile = File(...)):
    # In a real app we'd save the file or pass to ML model
    condition, syrup, meds = analyze_skin_allergy_image(file.filename)
    return AllergyResponse(
        detected_allergy=condition,
        syrup_recommendation=syrup,
        other_medicines=meds
    )
