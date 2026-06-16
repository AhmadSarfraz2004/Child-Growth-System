from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.responses import JSONResponse


# Create the FastAPI application instance.
app = FastAPI(title="Child Growth AI Service")

# Store the absolute folder path for this AI service.
BASE_DIR = Path(__file__).resolve().parent

# Store the folder where all trained model artifacts are kept.
MODEL_DIR = BASE_DIR / "models"

# Load the trained growth status model from ai-service/models.
growth_status_model = joblib.load(MODEL_DIR / "growth_status_model.pkl")

# Load categorical encoders used when the model was trained.
encoders = joblib.load(MODEL_DIR / "encoders.pkl")

# Load the target encoder so numeric predictions can be converted back to labels.
target_encoder = joblib.load(MODEL_DIR / "target_encoder.pkl")

# Load the exact feature column order expected by the trained model.
model_columns = joblib.load(MODEL_DIR / "model_columns.pkl")


def build_model_input(request_body: Dict[str, Any]) -> pd.DataFrame:
    # Reject empty request bodies before creating the DataFrame.
    if not request_body:
        raise ValueError("Request body is required")

    # Find required trained model columns that were not provided by the backend.
    missing_columns = [
        column_name
        for column_name in model_columns
        if column_name not in request_body or request_body[column_name] in (None, "")
    ]

    # Stop early instead of silently replacing real model inputs with zero.
    if missing_columns:
        joined_columns = ", ".join(missing_columns)
        raise ValueError(f"Missing required model input fields: {joined_columns}")

    # Convert the incoming JSON object into a one-row pandas DataFrame.
    input_frame = pd.DataFrame([request_body])

    # Apply saved encoders only to categorical columns present in the request.
    for column_name, encoder in encoders.items():
        # Skip this encoder when the request did not include that categorical field.
        if column_name not in input_frame.columns:
            continue

        # Convert categorical values to strings before comparing with encoder classes.
        input_frame[column_name] = input_frame[column_name].astype(str)

        # Find values that were not seen when the encoder was trained.
        unknown_values = set(input_frame[column_name]) - set(encoder.classes_)

        # Stop early with a clear message when a categorical value is invalid.
        if unknown_values:
            allowed_values = ", ".join(map(str, encoder.classes_))
            received_values = ", ".join(map(str, unknown_values))
            raise ValueError(
                f"Invalid value for {column_name}: {received_values}. "
                f"Allowed values: {allowed_values}"
            )

        # Transform the categorical value into the numeric code expected by the model.
        input_frame[column_name] = encoder.transform(input_frame[column_name])

    # Add every missing model feature with a safe default value of 0 as a final defensive fallback.
    for column_name in model_columns:
        if column_name not in input_frame.columns:
            input_frame[column_name] = 0

    # Reorder columns exactly as they were used during model training.
    input_frame = input_frame[model_columns]

    # Identify columns that were not encoded so they can be safely converted to numbers.
    numeric_columns = [column for column in model_columns if column not in encoders]

    # Convert numeric feature columns to numeric values for scikit-learn prediction.
    for column_name in numeric_columns:
        input_frame[column_name] = pd.to_numeric(input_frame[column_name], errors="coerce")

    # Detect invalid numeric values before calling the model.
    invalid_numeric_columns = [
        column_name
        for column_name in numeric_columns
        if input_frame[column_name].isna().any()
    ]

    # Return a helpful error if any numeric value could not be converted.
    if invalid_numeric_columns:
        joined_columns = ", ".join(invalid_numeric_columns)
        raise ValueError(f"Invalid numeric value for: {joined_columns}")

    # Return the fully prepared DataFrame to the prediction endpoint.
    return input_frame


@app.get("/health")
def health_check():
    # Return a simple status response so Node can confirm the service is alive.
    return {
        "success": True,
        "message": "AI service is running",
    }


@app.post("/predict/growth-status")
def predict_growth_status(request_body: Dict[str, Any]):
    # Start a try block so all prediction failures return clean JSON.
    try:
        # Build a model-ready DataFrame from the incoming request body.
        model_input = build_model_input(request_body)

        # Run the trained model to get the encoded growth status prediction.
        encoded_prediction = growth_status_model.predict(model_input)

        # Convert the encoded prediction back to the original growth status label.
        growth_status = target_encoder.inverse_transform(encoded_prediction)[0]

        # Return the prediction using the clean response shape expected by the backend.
        return {
            "success": True,
            "prediction": {
                "growthStatus": str(growth_status),
            },
        }
    except Exception as error:
        # Return a consistent error response without exposing a traceback to clients.
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": str(error),
            },
        )
