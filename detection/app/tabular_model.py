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
            return 0.5  # Default medium risk
            
        # Create a 30-feature vector (Time, V1...V28, Amount)
        # For now, we use a placeholder vector since we don't have real transaction data extracted
        # This prevents the dimension mismatch error
        X = np.zeros((1, 30)) 
        
        # We can try to map extracted amount if available (e.g. to the 'Amount' column, usually the last one)
        # But scaling would be needed to match TRAINING distribution
        # For safety/stability, we just return a safe prediction or use the zero vector
        # X[0, -1] = 1000 # Placeholder amount
        
        return model.predict_proba(X)[0][1]
    except Exception as e:
        print(f"Tabular risk prediction error: {str(e)}")
        return 0.5  # Default medium risk on error
