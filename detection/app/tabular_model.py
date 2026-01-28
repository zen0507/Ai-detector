import joblib
import numpy as np
import os
from pathlib import Path

# Get absolute path to model file
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "fraud_model.pkl"

try:
    model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    print(f"Warning: Model file not found at {MODEL_PATH}")
    model = None

def tabular_risk(extracted_text):
    try:
        if model is None:
            print("Warning: Model not loaded, returning default risk score")
            return 0.0  # Return 0 when model not available
            
        # Create a 30-feature vector (Time, V1...V28, Amount)
        # WARNING: Using zero vector provides no meaningful prediction
        # This is a placeholder until proper feature extraction is implemented
        X = np.zeros((1, 30)) 
        
        # We can try to map extracted amount if available (e.g. to the 'Amount' column, usually the last one)
        # But scaling would be needed to match TRAINING distribution
        # For safety/stability, we return 0.0 to avoid false positives from meaningless predictions
        # X[0, -1] = 1000 # Placeholder amount
        
        return 0.0  # Zero vector = no meaningful prediction, return 0
    except Exception as e:
        print(f"Tabular risk prediction error: {str(e)}")
        return 0.0  # Return 0 on error to avoid false positives
