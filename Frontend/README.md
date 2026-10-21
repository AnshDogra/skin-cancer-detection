# DermaLab Model Tester

A small React interface for testing the skin lesion classification API locally. Select or drop a JPEG, PNG, or WebP image (up to 10 MB), run a prediction, and inspect the predicted class and all returned scores.

## Run locally

1. Start the API from the `Backend` directory:

   ```powershell
   python -m uvicorn app:app --reload --port 8000
   ```

2. Start the frontend from this directory:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

The frontend checks `GET /health` and sends images as multipart form data to `POST /predict`. It uses `http://localhost:8000` by default. To point it at another API URL, set `VITE_API_URL` before starting Vite, for example:

```powershell
$env:VITE_API_URL = "http://localhost:8001"
npm run dev
```

The backend must allow the frontend origin through CORS. The included API allows `http://localhost:5173`.

## Disclaimer

Predictions are research output only and are not validated for medical diagnosis. Do not use this interface or model to make health decisions.
