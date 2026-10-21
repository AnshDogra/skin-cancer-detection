# Skin Cancer Detection Using Deep Learning

A web-based Skin Cancer Detection system built using **React, FastAPI, and MobileNetV3**. The application allows users to upload skin lesion images and obtain predictions from a trained deep learning model.

## Features

- Upload skin lesion images for prediction.
- Deep learning-based image classification using MobileNetV3.
- React-based frontend interface.
- FastAPI backend for model inference.
- Seven-class skin lesion classification.
- JSON-based communication between frontend and backend.

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Python
- FastAPI
- Uvicorn
- PyTorch
- Torchvision
- Pillow

**Model**
- MobileNetV3
- HAM10000 skin lesion dataset

## Project Structure

```text
skin-cancer-project/
├── Backend/
│   ├── app.py
│   ├── class_mapping.json
│   └── skin_cancer_model.pth
├── Frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Skin Lesion Classes

The model supports seven classes:

| Code | Class |
|---|---|
| `akiec` | Actinic keratoses and intraepithelial carcinoma |
| `bcc` | Basal cell carcinoma |
| `bkl` | Benign keratosis-like lesions |
| `df` | Dermatofibroma |
| `mel` | Melanoma |
| `nv` | Melanocytic nevi |
| `vasc` | Vascular lesions |

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AnshDogra/skin-cancer-detection.git
cd skin-cancer-detection
```

### 2. Run the frontend

```bash
cd Frontend
npm install
npm run dev
```

Open the local URL shown in your terminal.

### 3. Run the backend

Open a second terminal:

```bash
cd Backend
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install fastapi uvicorn python-multipart pillow torch torchvision
```

Start the API:

```bash
uvicorn app:app --reload
```

The API will normally be available at `http://127.0.0.1:8000`. If enabled, interactive API documentation is available at `/docs`.

> Ensure the backend's model-loading path, dependencies, and prediction endpoint match the actual implementation in `app.py`. Configure the frontend API URL and CORS settings before using the application across separate origins.

## Dataset

This project uses the HAM10000 skin lesion image dataset for training and evaluation.

## Disclaimer

This project is intended for educational and research purposes only. Its predictions are not a medical diagnosis and should not replace evaluation by a qualified healthcare professional.

## Author

**Ansh Dogra**

B.Tech — Electronics and Computer Science  
Ramdeobaba University, Nagpur
