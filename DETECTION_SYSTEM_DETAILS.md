# Detection Engine System Documentation

## 1. Core Models Used

The system utilizes a hybrid model approach for fraud detection:

### A. Computer Vision (CNN)
*   **Purpose**: Detects visual manipulations such as copy-move forgery, splicing, and error level anomalies.
*   **Architecture**: EfficientNet-B0 (Pre-trained) + Custom FFN Head.
*   **Input**: Document images (resized to 224x224 RGB).
*   **Output**: Probability score (0.0 - 1.0) indicating visual tampering.
*   **Location**: `detection/app/models/cnn_model.pth`

### B. Tabular/Meta Model (Random Forest)
*   **Purpose**: Analyzes non-visual metadata and numerical features.
*   **Algorithm**: Random Forest Classifier.
*   **Features**:
    *   `filesize`: Size of the document in bytes.
    *   `entropy`: Shannon entropy of the file (randomness measure).
    *   `ftype`: One-hot encoded file type (PDF/Check/Invoice).
*   **Input**: Feature vector `[filesize, entropy, ftype_0, ftype_1, ...]`.
*   **Output**: Probability score (0.0 - 1.0) based on metadata anomalies.
*   **Location**: `detection/app/models/tabular_model.joblib`

### C. Heuristic Rules Engine
*   **Purpose**: Detects logical inconsistencies that ML models might miss.
*   **Rules Implemented**:
    *   **Threshold Gaming**: Flags invoices just below approval limits (e.g., $4999 when limit is $5000).
    *   **Round Number Detection**: Flags unnatural total amounts (e.g., $5000.00).
    *   **Font Inconsistency**: Simple OCR check for varying font sizes/types on the same line.
    *   **Keyword Watchlist**: Flags documents containing suspicious terms ("Proforma", "Estimate").

---

## 2. API Endpoints (Backend)

The Detection System exposes its functionality via a FastAPI interface running on port 8001.

### `POST /predict/`
*   **Description**: Main entry point for document analysis.
*   **Input**: `file` (UploadFile - PNG/JPG/PDF).
*   **Process Flow**:
    1.  **Ingestion**: File is read and validated.
    2.  **Preprocessing**: Converted to image, resized, and normalized.
    3.  **Inference**:
        *   Passes image to CNN Model.
        *   Extracts metadata features for Tabular Model.
    4.  **Ensemble**: Combines scores (e.g., `0.7 * CNN + 0.3 * Tabular`) for a final `fraud_probability`.
    5.  **Explanation**: Generates `fraud_indicators` based on which model triggered the alert or what heuristic passed threshold.
*   **Response**:
    ```json
    {
        "filename": "invoice_123.png",
        "fraud_probability": 0.85,
        "risk_level": "high_risk",
        "verdict": "Likely Fake",
        "details": { ... }
    }
    ```

### `GET /health/`
*   **Description**: Health check endpoint.
*   **Response**: `{"status": "active", "models_loaded": true}`

---

## 3. Libraries & Dependencies

### Core ML & Data
*   **PyTorch (`torch`, `torchvision`)**: Engine for the CNN model.
*   **Scikit-Learn (`sklearn`)**: Engine for the Random Forest tabular model.
*   **Joblib**: Model serialization for the tabular model.
*   **Pandas/NumPy**: Data manipulation and feature vector construction.

### Image Processing
*   **Pillow (`PIL`)**: Image opening, resizing, and manipulation.
*   **OpenCV (`cv2`)**: Advanced image analysis (though primarily done via PIL currently).
*   **PyTesseract**: OCR wrapper for text extraction (used for heuristic text analysis).

### Web Framework
*   **FastAPI**: High-performance async API framework.
*   **Uvicorn**: ASGI server for running FastAPI.

### Report Generation
*   **ReportLab**: PDF generation engine for creating forensic audit reports.

---

## 4. Integration Workflow (Django <-> FastAPI)

The main user-facing application (Django) does not run the heavy ML models directly. Instead, it acts as a client:

1.  **User Upload**: User uploads a file to Django (`api_upload`).
2.  **Delegation**: Django's `FastAPIClient` sends the file to the local FastAPI service (`http://127.0.0.1:8001/predict/`).
3.  **Result Handling**:
    *   If FastAPI is **online**: Django saves the returned scores and indicators to the database.
    *   If FastAPI is **offline**: Django uses a *Fallback Mock System* to generate simulated results (safe failure mode) so the UI doesn't crash.
4.  **Persistence**: Results are stored in the `DocumentAnalysis` table (PostgreSQL/SQLite).
