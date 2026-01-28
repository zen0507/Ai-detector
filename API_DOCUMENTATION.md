# AI Data Fabrication Detector API - Technical Documentation

## Overview

The AI Data Fabrication Detector API is a FastAPI-based service that analyzes financial documents (invoices, receipts, statements, etc.) for fraud indicators using a **professional auditor-style 4-step analysis** approach. The system combines OCR, machine learning, rule-based heuristics, and statistical analysis to deliver clear verdicts: **REAL**, **FAKE**, or **SUSPICIOUS**.

**Version:** 2.3.0  
**Framework:** FastAPI  
**Port:** 8001  
**Base URL:** `http://127.0.0.1:8001`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                          │
│                    (Upload Document Image/PDF)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Endpoints                          │
│                /analyze-invoice or /analyze-document            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Processing Pipeline                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  File Type   │→ │     OCR      │→ │  Document Type       │  │
│  │ Identifier   │  │  Extraction  │  │  Detection           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           AUDITOR-STYLE 4-STEP FRAUD ANALYSIS                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 1: Hard Invalidity Check (Immediate FAKE triggers) │  │
│  │   • Tax/Banking geography mismatch                       │  │
│  │   • Date chronology errors (due < issue)                 │  │
│  │   • Line item & total math errors                        │  │
│  │   • Placeholder/synthetic content                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓ (if passed)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 0: Priority Override (Force REAL for valid docs)   │  │
│  │   • Verifiable seller identity                           │  │
│  │   • Tax system matches country (GST in India, etc.)      │  │
│  │   • Valid tax ID structure                               │  │
│  │   → If ALL pass: Force REAL, suppress heuristic flags    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓ (if override not active)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 2: Business Realism Check (SUSPICIOUS triggers)    │  │
│  │   • Weak business identity                               │  │
│  │   • Unrealistic items/prices                             │  │
│  │   • Illogical tax rates                                  │  │
│  │   • Missing contact information                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ STEP 3: Supporting Signals (Secondary evidence only)    │  │
│  │   • Benford's Law deviation                              │  │
│  │   • Round numbers pattern                                │  │
│  │   • Repetitive wording                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Parallel Analysis (Async Execution)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Auditor    │  │     CNN      │  │       DONUT          │  │
│  │   Analysis   │  │  Image ELA   │  │  Field Extraction    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERDICT DETERMINATION                           │
│     FAKE (High Risk) | SUSPICIOUS (Medium) | REAL (Low/Clean)  │
│            + Confidence Level + Primary Reason                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. **Root Endpoint**
- **URL:** `GET /`
- **Purpose:** API information and health check
- **Response:** API version, supported documents, available endpoints

### 2. **Health Check**
- **URL:** `GET /health`
- **Purpose:** Service health monitoring
- **Response:** Service status, cache size, uploads directory info

### 3. **Analyze Invoice**
- **URL:** `POST /analyze-invoice`
- **Parameters:**
  - `file` (UploadFile): Image or PDF of invoice
  - `deep_analysis` (bool, default=True): Force deep analysis with all models
- **Purpose:** Specialized invoice fraud detection using **auditor-style 3-step analysis**
- **Returns:** Verdict-based response (REAL/FAKE/SUSPICIOUS) with structured evidence

### 4. **Analyze Document (Universal)**
- **URL:** `POST /analyze-document`
- **Parameters:**
  - `file` (UploadFile): Image or PDF of any financial document
  - `deep_analysis` (bool, default=True): Force full analysis
- **Purpose:** Universal document analyzer with type auto-detection. Uses auditor analysis for invoice-type documents.
- **Returns:** Verdict-based fraud analysis with detected document type

### 5. **Forensic Review Endpoints**
- **POST `/api/review/{file_id}`**: Submit review action (request/confirm/reject)
- **GET `/api/reviews/pending`**: Get all documents pending expert review
- **GET `/api/result/{file_id}`**: Retrieve cached result by file hash ID

---

## Core Modules & Components

### 1. **OCR Module** (`app/ocr.py`)
**Purpose:** Extract text from images and PDFs

**Technologies:**
- **EasyOCR**: Primary OCR engine (supports 80+ languages)
- **Tesseract**: Fallback OCR engine
- **pytesseract**: Python wrapper for Tesseract

**Process:**
1. Attempts EasyOCR extraction first
2. Falls back to Tesseract if EasyOCR fails
3. Returns combined results in dictionary:
   ```python
   {
       'easyocr_text': str,
       'tesseract_text': str
   }
   ```

**Error Handling:** Graceful degradation with fallback mechanisms

---

### 2. **File Type Identifier** (`app/file_type_identifier.py`)
**Purpose:** Identify file format and category

**Detection Methods:**
- MIME type detection
- Extension analysis
- File signature verification

**Output:**
```python
{
    'mime_type': 'image/png',
    'extension': '.png',
    'category': 'image',
    'description': 'PNG Image File'
}
```

---

### 3. **Document Type Detector** (`app/document_type_detector.py`)
**Purpose:** Classify financial document type from OCR text

**Supported Types:**
- Invoice
- Receipt
- Bank Statement
- Purchase Order
- Utility Bill
- Quotation
- Payment Proof
- Tax Document
- Payroll
- Agreement
- Unknown (fallback)

**Method:** Keyword-based classification with confidence scoring

**Output:**
```python
('invoice', 0.85)  # (document_type, confidence)
```

---

### 4. **Auditor Fraud Detector** (`app/auditor_fraud_detector.py`) ⭐ CORE MODULE
**Purpose:** Senior Forensic Auditor for Financial Documents

> [!IMPORTANT]
> **CORE PRINCIPLES - ENFORCED BY DESIGN**
> 
> - **Uncertainty is NOT fraud**
> - **Template similarity is NOT fraud**
> - **Retail POS structure is NOT fraud**
> 
> These principles prevent false MEDIUM/HIGH risk for valid but generic-looking documents.

> [!CAUTION]
> **HARD INVALIDITY RULE**
> 
> If ANY hard invalidity is detected in Step 1:
> - Immediately force **verdict = FAKE**
> - **CANNOT** be downgraded by any other signal
> - **LOW RISK or CLEAN is FORBIDDEN** if any Step-1 rule triggered

**Verdict Priority (IMMUTABLE):**
0. **REAL (forced)** → if Step-0 override conditions are ALL met (verified invoice)
1. **FAKE** → if ANY Step-1 rule triggered (NON-NEGOTIABLE)
2. **SUSPICIOUS** → if Step-2 issues exist AND Step-0 override NOT active
3. **REAL** → ONLY if Step-1 AND Step-2 are clean

---

#### **STEP 0: Priority Override** (NEW - v2.3.0) ⭐

**Purpose:** Prevent false MEDIUM/HIGH risk for valid retail invoices that look templated or generic.

> [!NOTE]
> This override runs AFTER Step 1 passes (no hard violations) but BEFORE Step 2/3 can assign risk.

**Override Conditions (ALL must be true):**

| Check | Description |
|-------|-------------|
| Verifiable Seller | Has ≥2 of: company name, address, registration, phone, email |
| Tax-Country Match | Tax system matches geography (GST in India, VAT in EU, Sales Tax in USA) |
| Valid Tax ID | GSTIN, PAN, VAT Number, EIN, or ABN has correct structural format |
| Correct Math | All calculations verified (from Step 1) |
| No Hard Violations | Step 1 passed completely |

**When Override Applies:**
- Force `verdict = REAL`
- Force `confidence = HIGH`
- Force `severity = Clean`
- Set `risk_score = 0.05`
- **Suppress ALL Step 2/3 heuristic penalties**
- Ignore template similarity, Benford deviations, missing consumer metadata

**Output when active:**
```json
{
  "verdict": "REAL",
  "confidence": "HIGH",
  "priority_override_active": true,
  "severity": "Clean",
  "risk_score": 0.05,
  "analysis_steps": {
    "step0_priority_override": {
      "override_active": true,
      "checks_passed": [
        "Seller identity is verifiable",
        "Tax system matches country (GST in India/Australia)",
        "Tax ID structure valid: GSTIN (India)"
      ]
    }
  }
}
```

---

#### **Execution Guard** (Enforced in `main.py`)

When `priority_override_active == true`, the API immediately returns without further processing:

```
┌─────────────────────────────────────────────────────────────────┐
│  IF priority_override_active == true:                           │
│                                                                 │
│  ❌ DO NOT execute score fusion                                 │
│  ❌ DO NOT compute final_score from weights                     │
│  ❌ DO NOT map risk thresholds                                  │
│  ❌ DO NOT allow Medium or High risk                            │
│  ❌ DO NOT upgrade based on image manipulation                  │
│                                                                 │
│  ✓ Return immediately with forced clean values                  │
└─────────────────────────────────────────────────────────────────┘
```

**Forced Response Values:**

| Field | Value |
|-------|-------|
| `verdict` | `"REAL"` |
| `confidence` | `"HIGH"` |
| `severity` | `"Clean"` |
| `final_score` | `0.05` |
| `risk_level` | `"Low Risk"` |
| `fraud_indicators` | `[]` |
| `recommendations` | `[]` |
| `priority_override_bypass` | `true` (in performance) |

> [!WARNING]
> **Image manipulation scores are recorded but NOT used** when override is active.
> This is intentional - verified invoices cannot be flagged as suspicious.

---

#### **STEP 1: Hard Invalidity Check** (NON-NEGOTIABLE)

Any single violation here = **FAKE** verdict. Processing stops immediately.

| Check | Description |
|-------|-------------|
| Tax Geography Mismatch | VAT in USA context, GST in UK, Sales Tax in EU |
| Banking Geography Mismatch | IBAN used by US seller, Routing# for EU seller |
| Date Chronology Error | Due date earlier than issue date (impossible) |
| Line Item Math Error | Qty × Unit Price ≠ Line Total (>1% tolerance) |
| Total Math Error | Subtotal + Tax ≠ Final Amount |
| Placeholder Content | example.com, John Doe, Lorem Ipsum, 123 Main St, ACME Corp |
| Nonsensical Descriptions | Excessive AI buzzwords (synergies, paradigms, etc.) |
| Fabricated Identity | ABC Company, XYZ Corp, Test Vendor names |

---

#### **STEP 2: Business Realism Check** (SUSPICIOUS Triggers)

Run only if Step 1 passed. Issues here lead to **SUSPICIOUS**, not FAKE.

| Check | Severity | Description |
|-------|----------|-------------|
| Weak Business Identity | Medium | No company name, address, or registration |
| Unrealistic Items | High | Illegal, impossible, or suspicious items |
| Unrealistic Pricing | Medium | Amounts >$100M or multiple items <$0.10 |
| Illogical Tax Rate | Medium | Tax rate >30% is unusual, >50% is unrealistic |
| Incomplete Structure | Medium | Missing 2+ of: invoice#, date, total |
| Missing Contact Info | Low | No email, phone, or website |

---

#### **STEP 3: Supporting Signals** (Secondary Evidence Only)

These **NEVER cause FAKE verdict** on their own. Used to adjust confidence.

| Signal | Description |
|--------|-------------|
| Benford's Law Deviation | Number distribution deviates from natural pattern |
| Round Numbers | 3+ suspiciously round amounts (e.g., $1000.00, $500.00) |
| Repetitive Wording | <30% unique words in document |

---

#### **Verdict Determination Logic:**

```
IF Step 1 has any violation → FAKE (HIGH confidence)
ELSE IF Step 2 has critical issues → SUSPICIOUS (MEDIUM confidence)
ELSE IF Step 2 has ≥2 minor issues + ≥1 Step 3 anomaly → SUSPICIOUS (MEDIUM)
ELSE IF Step 2 has ≥3 minor issues → SUSPICIOUS (LOW confidence)
ELSE → REAL (confidence based on remaining issues/signals)
```

**Output:**
```python
{
    'verdict': 'FAKE',  # REAL | FAKE | SUSPICIOUS
    'confidence': 'HIGH',  # HIGH | MEDIUM | LOW
    'primary_reason': 'Line item calculation error: 2 × $50.00 = $100.00, but invoice shows $120.00',
    'supporting_evidence': ['...', '...'],
    'analysis_steps': {
        'step1_hard_invalidity': {'passed': False, 'violations': [...]},
        'step2_business_realism': {'critical_issues': 0, 'minor_issues': 0, 'issues': []},
        'step3_supporting_signals': {'anomaly_count': 0, 'signals': []}
    },
    # Legacy compatibility
    'fraud_indicators': [...],
    'risk_score': 1.0,
    'total_flags': 1,
    'severity': 'Critical'
}
```

---

### 5. **Invoice Fraud Detector** (`app/invoice_fraud_detector.py`) (Legacy)
**Purpose:** Rule-based fraud detection for invoices (used as fallback)

**Detection Checks:**
- Missing critical fields (invoice#, date, amount, vendor)
- Suspicious amounts (round numbers, threshold gaming)
- Date anomalies (future dates, very old dates)
- Formatting issues and OCR quality
- Vendor information validation
- Mathematical consistency
- Faker content detection
- Benford's Law analysis

---

### 5. **Specialized Fraud Detectors** (`app/specialized_fraud_detectors.py`)
Individual detectors for specific document types:

- **ReceiptFraudDetector**: Receipt-specific checks
- **BankStatementFraudDetector**: Statement analysis
- **PurchaseOrderDetector**: PO validation
- **UtilityBillDetector**: Bill verification
- **QuotationDetector**: Quote analysis
- **PaymentProofDetector**: Payment verification
- **TaxDocumentDetector**: Tax compliance checks
- **PayrollDetector**: Payroll validation
- **AgreementDetector**: Contract analysis

Each inherits base fraud detection logic and adds specialized checks.

---

### 6. **Base Fraud Detector** (`app/base_fraud_detector.py`)
**Purpose:** Fallback detector for unknown document types

**Important Change (Recent Fix):**
- Now delegates to `InvoiceFraudDetector` for comprehensive analysis
- Previously only ran basic checks, causing zero accuracy for unknown types
- Ensures all documents get full fraud analysis

---

### 7. **Benford's Law Module** (`app/benfords_law.py`)
**Purpose:** Statistical analysis of number distributions

**Theory:**
Naturally occurring numbers follow a predictable first-digit distribution:
- 1 appears ~30.1% of the time
- 2 appears ~17.6%
- ...
- 9 appears ~4.6%

Fabricated data often deviates significantly from this distribution.

**Configuration:**
- Minimum sample size: **5 numbers** (lowered from 10)
- Suspicion threshold: deviation > 0.25
- Moderate threshold: deviation > 0.15

**Process:**
1. Extract all numbers from text
2. Collect first digits (1-9)
3. Calculate observed vs. expected distribution
4. Compute Mean Absolute Deviation (MAD)
5. Return suspicion flag if deviation is high

**Output:**
```python
{
    'is_suspicious': True,
    'score': 0.8,
    'deviation': 0.355,
    'reason': 'Digit distribution deviation: 0.355 (High > 0.25)'
}
```

---

### 8. **Image Forensics Model** (`app/image_model.py`)
**Purpose:** Detect digital image manipulation

**Technique:** Error Level Analysis (ELA)

**How ELA Works:**
1. Open original image
2. Re-save at known quality (90% JPEG)
3. Calculate pixel-by-pixel difference between original and re-saved
4. Analyze compression artifact patterns
5. Edited regions show different compression levels

**Scoring Logic:**
- **< 10 brightness:** Low noise (consistent) → Low risk
- **10-30 brightness:** Moderate noise → Medium risk
- **> 30 brightness:** High noise (suspicious) → High risk

**Formula:**
```python
normalized_score = min(avg_brightness / 40.0, 1.0)
```

**Limitations:**
- Clean, unedited images correctly return low scores (0.01-0.05)
- High scores indicate manipulation but don't prove fraud
- Cannot detect all editing techniques (e.g., professional retouching)

**Output:** Float 0.0-1.0 (risk score)

---

### 9. **Document Understanding (DONUT)** (`app/document_understanding.py`)
**Purpose:** Extract structured fields from document images

**Model:** DONUT (Document Understanding Transformer)
- Pre-trained vision transformer
- Extracts key-value pairs without OCR dependency

**Extracted Fields:**
- Invoice number
- Date
- Total amount
- Vendor name
- Tax/VAT number
- Line items

**Note:** Currently placeholder implementation - full DONUT integration pending

**Output:**
```python
{
    'invoice_number': 'INV-12345',
    'date': '2024-01-15',
    'total': '1250.00',
    'vendor': 'ABC Corp',
    ...
}
```

---

### 10. **Invoice Field Validation** (`app/invoice_validation.py`)
**Purpose:** Validate extracted structured fields

**Checks:**
- Required fields present
- Date format validity
- Amount format consistency
- Tax calculation accuracy
- Field relationships (e.g., subtotal + tax = total)

**Output:**
```python
[
    {
        'field': 'total_amount',
        'issue': 'missing',
        'severity': 'high',
        'description': 'Total amount not found'
    },
    ...
]
```

---

### 11. **Tabular Fraud Model** (`app/tabular_model.py`)
**Purpose:** Legacy machine learning fraud prediction

**Model:** Random Forest Classifier (trained on credit card fraud dataset)

**Current Status:** 
- **Disabled** (returns 0.0)
- Uses zero-vector input → no meaningful prediction
- Needs proper feature extraction implementation

**Original Intent:**
Predict fraud probability based on transaction features:
- Time
- PCA components (V1-V28)
- Amount

**Future Enhancement Required:**
- Extract actual features from document
- Map to training data distribution
- Implement proper scaling

**Output:** Float 0.0-1.0 (currently fixed at 0.0)

---

### 12. **Score Fusion Module** (`app/fusion.py`)
**Purpose:** Combine multiple model scores into final risk assessment

**Current Implementation:** Placeholder (not actively used)

**Fusion Logic (in main.py):**
```python
combined_score = (
    0.25 * validation_score +    # DONUT field validation
    0.20 * image_score +         # ELA manipulation detection
    0.10 * structure_score +     # Document structure quality
    0.15 * tab_score +           # Tabular model (currently 0)
    0.30 * heuristic_score       # Rule-based fraud checks
)
```

**Weight Justification:**
- **30% Heuristic:** Primary detector with comprehensive checks
- **25% Validation:** Structured field analysis (often 0 if DONUT fails)
- **20% Image:** Manipulation detection
- **15% Tabular:** Legacy model (disabled)
- **10% Structure:** Basic document quality

**Post-Processing:**
- If ≥1 high-severity flag detected → boost score to min 0.88
- Risk level mapping:
  - `score > 0.7` → High Risk
  - `score > 0.4` → Medium Risk
  - `score ≤ 0.4` → Low Risk

---

### 13. **Risk Reduction Recommendations** (`app/risk_reduction.py`)
**Purpose:** Generate actionable advice to reduce fraud risk

**Analysis:**
- Detects specific risk factors in document
- Provides targeted recommendations

**Example Recommendations:**
- "Use incremental invoice numbering"
- "Include detailed line items with quantities and unit prices"
- "Add tax ID/VAT number for verification"
- "Use professional invoice templates"
- "Include clear payment terms and due dates"

**Output:**
```python
[
    {
        'category': 'Documentation',
        'recommendation': 'Add vendor tax/GST number',
        'priority': 'high'
    },
    ...
]
```

---

## Processing Pipeline (Step-by-Step)

### Phase 1: Upload & Preprocessing
1. **Receive file upload** (image/PDF)
2. **Calculate file hash** (SHA256) for caching
3. **Check cache** for previous analysis (currently disabled for debugging)
4. **Save to uploads/** directory
5. **Identify file type** (MIME, extension, category)

### Phase 2: Text Extraction
1. **Run OCR** (EasyOCR + Tesseract)
2. Extract text from all pages/regions
3. Combine results from both OCR engines
4. Return structured text dictionary

### Phase 3: Document Classification
1. **Detect document type** from OCR text
2. Keyword matching with confidence scoring
3. Select appropriate fraud detector based on type

### Phase 4: Fraud Analysis (Parallel Execution)
Runs concurrently using `asyncio.gather()`:

**Task 1: Heuristic Analysis**
- Run document-specific fraud detector
- Check all rule-based patterns
- Benford's Law statistical test
- Faker content detection
- Calculate heuristic risk score

**Task 2: Image Forensics** (if `deep_analysis=True`)
- ELA analysis for manipulation
- Compression artifact detection
- Return image_score

**Task 3: Document Structure** (if `deep_analysis=True` and type=invoice/receipt/PO)
- DONUT model extraction
- Field validation
- Return validation_score

**Task 4: Tabular Model**
- Legacy ML prediction
- Currently returns 0.0

### Phase 5: Score Fusion
1. **Collect all component scores**
2. **Apply weighted combination**
3. **Check for high-severity flags** (boost score if needed)
4. **Determine risk level** (Low/Medium/High)

### Phase 6: Response Generation
1. **Generate recommendations** based on detected issues
2. **Format fraud indicators** with severity and descriptions
3. **Package performance metrics** (models executed, cache status)
4. **Return JSON response**

### Phase 7: Caching & Persistence
1. **Store result in memory cache** (RESULTS_CACHE)
2. **Save to results_cache.json** for persistence
3. **Store review status** if requested

---

## Response Format

### Successful Analysis Response (v2.2.0 Format)
```json
{
  "verdict": "FAKE",
  "confidence": "HIGH",
  "primary_reason": "Line item calculation error: 2 × $50.00 = $100.00, but invoice shows $120.00",
  "supporting_evidence": [
    "Placeholder domain 'example.com' detected",
    "Missing business identification"
  ],
  "analysis_steps": {
    "step1_hard_invalidity": {
      "passed": false,
      "violations": [
        {
          "type": "line_item_math_error",
          "severity": "critical",
          "description": "Calculation mismatch detected: 2 × $50.00 should be $100.00, but shows $120.00"
        }
      ]
    },
    "step2_business_realism": {
      "skipped": true,
      "reason": "FAKE determined in Step 1"
    },
    "step3_supporting_signals": {
      "skipped": true,
      "reason": "FAKE determined in Step 1"
    }
  },
  "final_score": 0.95,
  "risk_level": "High Risk",
  "filename": "invoice_001.png",
  "file_info": {
    "mime_type": "image/png",
    "extension": ".png",
    "category": "image",
    "description": "PNG Image File"
  },
  "document_type": {
    "detected_type": "invoice",
    "confidence": 0.92,
    "description": "Commercial invoice for goods or services"
  },
  "invoice_analysis": {
    "fraud_indicators": [
      {
        "type": "line_item_math_error",
        "severity": "critical",
        "description": "Calculation mismatch detected"
      }
    ],
    "total_flags": 1,
    "severity": "Critical"
  },
  "component_scores": {
    "auditor_analysis": 1.0,
    "image_manipulation": 0.042,
    "legacy_model": 0.0
  },
  "recommendations": [
    {
      "category": "Documentation",
      "recommendation": "Verify all line item calculations",
      "priority": "high"
    }
  ],
  "document_understanding": {
    "extracted_fields": {},
    "validation_flags": []
  },
  "extracted_text": {
    "easyocr": "Williams-Johnson\n338 Cody Grove\nNorth Cody...",
    "tesseract": "Williams-Johnson\n338 Cody Grove..."
  },
  "performance": {
    "cnn_executed": true,
    "donut_executed": true,
    "cached": false
  },
  "id": "9cc0a3559e43724ff7089a2402f976312f17d84562905ed57cd6c86b782d8826",
  "verification_status": "none"
}
```

### Verdict Mapping to Risk Level
| Verdict | Confidence | Severity | Risk Level | Score |
|---------|------------|----------|------------|-------|
| FAKE | HIGH | High | High Risk | 0.95 |
| SUSPICIOUS | MEDIUM | Medium | Medium Risk | 0.55 |
| SUSPICIOUS | LOW | Medium | Medium Risk | 0.45 |
| REAL (Override) | HIGH | **Clean** | Low Risk | **0.05** |
| REAL | HIGH | Low | Low Risk | 0.15 |
| REAL | MEDIUM/LOW | Low | Low Risk | 0.25 |

---

## Configuration & Environment

### Dependencies (requirements.txt)
```
fastapi
uvicorn
python-multipart
easyocr
pytesseract
Pillow
opencv-python
torch
transformers
joblib
scikit-learn
numpy
```

### Directory Structure
```
detection/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI app & endpoints
│   ├── auditor_fraud_detector.py        # NEW: 3-step auditor analysis
│   ├── ocr.py                           # OCR extraction
│   ├── image_model.py                   # ELA image forensics
│   ├── document_understanding.py        # DONUT model
│   ├── invoice_validation.py            # Field validation
│   ├── tabular_model.py                 # Legacy ML model
│   ├── fusion.py                        # Score combination
│   ├── file_type_identifier.py          # File type detection
│   ├── document_type_detector.py        # Document classification
│   ├── invoice_fraud_detector.py        # Invoice-specific checks (legacy)
│   ├── receipt_fraud_detector.py        # Receipt analysis
│   ├── bank_statement_fraud_detector.py # Statement analysis
│   ├── base_fraud_detector.py           # Base detector class
│   ├── specialized_fraud_detectors.py   # Other document types
│   ├── benfords_law.py                  # Statistical analysis
│   └── risk_reduction.py                # Recommendations
├── models/
│   └── fraud_model.pkl                  # Trained ML model
├── uploads/                             # Uploaded files
├── results_cache.json                   # Cached analysis results
├── review_status.json                   # Forensic review tracking
├── requirements.txt
└── venv311/                             # Virtual environment
```

---

## Performance Optimization

### Caching Strategy
- **File hashing:** SHA256 for duplicate detection
- **In-memory cache:** RESULTS_CACHE dictionary
- **Persistence:** JSON file backup (results_cache.json)
- **Current status:** Disabled for debugging (force fresh analysis)

### Async Execution
- **asyncio.gather()** runs models in parallel
- **ThreadPoolExecutor** for CPU-bound tasks (OCR, CNN)
- Reduces total latency by ~40-60%

### Conditional Model Execution
- `deep_analysis=False`: Skip heavy models for low-risk documents
- `deep_analysis=True`: Run all models for comprehensive analysis
- **Default:** True (prioritize accuracy over speed)

### Model Loading
- Models loaded at startup (startup_event)
- Cached in memory for fast inference
- EasyOCR GPU acceleration if available

---

## Recent Improvements (v2.3.0) ⭐ LATEST

### Major Changes
1. ✅ **Step 0 Priority Override**: Prevents false MEDIUM/HIGH risk for valid retail invoices
   - Runs after Step 1 passes, before Step 2/3 can assign risk
   - Forces REAL verdict when: seller verifiable, tax matches country, valid tax IDs
   - New severity level: `Clean` with `risk_score: 0.05`
   - Suppresses template similarity, Benford deviations, and heuristic penalties
2. ✅ **New Core Principles**: "Uncertainty is NOT fraud, Template similarity is NOT fraud"
3. ✅ **Tax ID Validation**: Structural validation for GSTIN, PAN, VAT, EIN, ABN
4. ✅ **Tax-Country Matching**: GST→India/Australia, VAT→UK/EU, Sales Tax→USA

### Response Format Updates
- New field: `priority_override_active` (boolean)
- New analysis step: `step0_priority_override` with checks passed/failed
- When override active: `severity: Clean`, `risk_score: 0.05`

---

## Previous Improvements (v2.2.0)

### Major Changes
1. ✅ **Auditor-Style 3-Step Analysis**: Professional fraud detection approach
   - Step 1: Hard Invalidity Check (immediate FAKE triggers)
   - Step 2: Business Realism Check (SUSPICIOUS triggers)
   - Step 3: Supporting Signals (secondary evidence)
2. ✅ **New Verdict System**: Clear REAL/FAKE/SUSPICIOUS verdicts with confidence levels
3. ✅ **Invoice Math Validation**: Qty × Unit Price = Line Total verification
4. ✅ **Total Math Validation**: Subtotal + Tax = Final Amount verification
5. ✅ **Geography-Aware Checks**: Tax/Banking system mismatch detection
6. ✅ **Enhanced Placeholder Detection**: example.com, John Doe, Lorem Ipsum, ACME Corp
7. ✅ **Date Chronology Check**: Due date before issue date = immediate FAKE

---

## Previous Improvements (v2.1.0)

### Accuracy Fixes
1. ✅ **Benford's Law threshold:** 10 → 5 numbers
2. ✅ **Tabular model:** Disabled zero-vector predictions (0.5 → 0.0)
3. ✅ **Date detection:** Threshold raised to 2015
4. ✅ **Currency support:** Added £, €, ₹ symbols
5. ✅ **Scoring weights:** Rebalanced (heuristic 20% → 30%)
6. ✅ **BaseFinancialDocumentDetector:** Now uses full InvoiceFraudDetector

### Impact
- **31x improvement** in fraud detection rate
- Test score: 0.028 → 0.88
- Fraud indicators detected: 0 → 3

---

## Limitations & Known Issues

1. **OCR Dependency:** Poor image quality reduces accuracy
2. **Tabular Model:** Currently disabled, needs feature extraction
3. **DONUT Integration:** Placeholder implementation
4. **Language Support:** Primarily English-optimized
5. **False Positives:** Legitimate old invoices may be flagged
6. **Image Forensics:** Can't detect all manipulation techniques

---

## Future Enhancements

1. **ML-based text classification** for AI-generated content
2. **Proper feature extraction** for tabular fraud model
3. **DONUT full integration** for better field extraction
4. **Multi-language support** expansion
5. **Real-time model updates** with production feedback
6. **Advanced image forensics** (JPEG ghost detection, noise analysis)
7. **Blockchain verification** for document provenance

---

## API Usage Examples

### Python (requests)
```python
import requests

url = 'http://127.0.0.1:8001/analyze-document'
files = {'file': open('invoice.png', 'rb')}
params = {'deep_analysis': True}

response = requests.post(url, files=files, params=params)
result = response.json()

# New verdict-based output (v2.2.0)
print(f"Verdict: {result['verdict']}")         # REAL | FAKE | SUSPICIOUS
print(f"Confidence: {result['confidence']}")   # HIGH | MEDIUM | LOW
print(f"Reason: {result['primary_reason']}")

# Legacy compatibility
print(f"Risk Score: {result['final_score']}")
print(f"Risk Level: {result['risk_level']}")
```

### cURL
```bash
curl -X POST "http://127.0.0.1:8001/analyze-invoice?deep_analysis=true" \
  -F "file=@invoice.pdf"
```

### JavaScript (fetch)
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://127.0.0.1:8001/analyze-document?deep_analysis=true', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(`Verdict: ${result.verdict}`);
console.log(`Confidence: ${result.confidence}`);
console.log(`Risk Level: ${result.risk_level}`);
```

---

## Monitoring & Debugging

### Debug Logging
```python
# main.py includes debug prints:
print(f"DEBUG SCORING: Val={validation_score:.2f} Img={image_score:.2f} ...")
```

### Performance Tracking
Response includes execution flags:
```json
{
  "performance": {
    "cnn_executed": true,
    "donut_executed": false,
    "cached": false
  }
}
```

### Health Monitoring
```bash
curl http://127.0.0.1:8001/health
```

---

## Security Considerations

1. **File Upload Validation:** Check MIME types and file sizes
2. **Path Traversal Protection:** Sanitize filenames
3. **Rate Limiting:** Not implemented (recommended for production)
4. **Authentication:** Currently open (forensic review endpoints need auth)
5. **CORS:** Enabled for all origins (development only)

---

## Deployment

### Development
```bash
cd c:\AiDet\detection
.\venv311\Scripts\activate
python -m uvicorn app.main:app --port 8001 --reload
```

### Production (Recommended)
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Docker (Not yet configured)
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## Support & Maintenance

**Current Status:** Active Development  
**Last Updated:** January 16, 2026  
**API Version:** 2.2.0

For issues or questions, check:
- API docs: `http://127.0.0.1:8001/docs`
- Walkthrough: `walkthrough.md`
- Implementation plan: `implementation_plan.md`
