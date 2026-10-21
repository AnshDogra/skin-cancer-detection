
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms
import torch
import torch.nn as nn
import json
import io
import os

app = FastAPI(title="Skin Lesion Classification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "skin_cancer_model.pth")
MAPPING_PATH = os.path.join(BASE_DIR, "class_mapping.json")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

with open(MAPPING_PATH, "r") as f:
    class_to_idx = json.load(f)

class_to_idx = {
    name: int(idx) for name, idx in class_to_idx.items()
}
idx_to_class = {idx: name for name, idx in class_to_idx.items()}

model = models.mobilenet_v3_large(weights=None)
model.classifier[3] = nn.Linear(
    model.classifier[3].in_features,
    len(class_to_idx)
)

state_dict = torch.load(
    MODEL_PATH, map_location=device, weights_only=True
)
model.load_state_dict(state_dict)
model.to(device)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])

@app.get("/")
def home():
    return {"message": "Skin Lesion Classification API is running"}

@app.get("/health")
def health():
    return {"status": "ok", "device": str(device)}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type not in [
        "image/jpeg", "image/png", "image/webp"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPEG, PNG, or WebP image."
        )

    content = await file.read()

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be smaller than 10 MB."
        )

    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.softmax(outputs, dim=1)[0].cpu()

    results = [
        {
            "class": idx_to_class[i],
            "score": round(float(probs[i]), 6)
        }
        for i in range(len(idx_to_class))
    ]

    results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "predicted_class": results[0]["class"],
        "scores": results,
        "notice": (
            "Research output only. This model is not validated "
            "for medical diagnosis."
        )
    }
