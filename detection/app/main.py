from fastapi import FastAPI, UploadFile, HTTPException, Query
from fastapi.responses import JSONResponse
import os
import asyncio
import hashlib
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from app.ocr import extract_text
from app.image_model import image_risk
from app.document_understanding import extract_invoice_fields
from app.invoice_validation import validate_invoice_fields
from app.tabular_model import tabular_risk
from app.fusion import final_score
from app.file_type_identifier import FileTypeIdentifier

app = FastAPI(
    title="AI Data Fabrication Detector",
    description="API for detecting fraudulent invoices and documents using AI",
    version="2.1.0"
)

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

import json

# In-memory result cache with JSON persistence
CACHE_FILE = Path("results_cache.json")
RESULTS_CACHE = {}

def load_cache():
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to load cache: {e}")
            return {}
    return {}

def save_cache():
    try:
        with open(CACHE_FILE, "w") as f:
            json.dump(RESULTS_CACHE, f, indent=2)
    except Exception as e:
        print(f"Failed to save cache: {e}")

# RESULTS_CACHE = load_cache()
RESULTS_CACHE = {} # FORCE EMPTY CACHE FOR DEBUGGING


# In-memory review requests with JSON persistence
REVIEW_FILE = Path("review_status.json")
REVIEW_STATUS = {}

def load_reviews():
    if REVIEW_FILE.exists():
        try:
            with open(REVIEW_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to load reviews: {e}")
            return {}
    return {}

def save_reviews():
    try:
        with open(REVIEW_FILE, "w") as f:
            json.dump(REVIEW_STATUS, f, indent=2)
    except Exception as e:
        print(f"Failed to save reviews: {e}")

REVIEW_STATUS = load_reviews()

@app.on_event("startup")
async def startup_event():
    """Warm up models on startup"""
    print("Warming up models...")
    # These imports trigger model loading
    import app.ocr
    import app.image_model
    try:
        pass
    except Exception as e:
        print(f"Warmup warning: {e}")
    print("Models ready.")

def calculate_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

@app.get("/")
async def root():
    """Welcome endpoint with API information"""
    return {
        "message": "Welcome to AI Data Fabrication Detector API",
        "version": "2.1.0",
        "supported_documents": [
            "Invoices", "Receipts", "Bank Statements", "Purchase Orders", 
            "Utility Bills", "Quotations", "Payment Proofs", "Tax Documents",
            "Payroll", "Agreements"
        ],
        "endpoints": {
            "docs": "/docs",
            "analyze_any_document": "/analyze-document (POST)",
            "analyze_invoice": "/analyze-invoice (POST)",
            "health": "/health"
        },
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Data Fabrication Detector",
        "uploads_dir": str(UPLOAD_DIR.absolute()),
        "uploads_dir_exists": UPLOAD_DIR.exists(),
        "cache_size": len(RESULTS_CACHE)
    }

@app.post("/analyze-invoice")
async def analyze_invoice(file: UploadFile, deep_analysis: bool = Query(True, description="Force deep analysis (slow)")):
    """
    Analyze an invoice using professional auditor-style fraud detection.
    
    Returns verdict: REAL, FAKE, or SUSPICIOUS with structured evidence.
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        content = await file.read()
        
        file_hash = calculate_file_hash(content)
        if file_hash in RESULTS_CACHE:
            print(f"Ignoring cache for debug: {file.filename}")
            # return RESULTS_CACHE[file_hash]
            
        path = UPLOAD_DIR / file.filename
        with open(path, "wb") as f:
            f.write(content)
        
        file_info = FileTypeIdentifier.identify_file_type(str(path))
        loop = asyncio.get_event_loop()
        
        # Step 1: Extract text (Async Wrapper)
        ocr_data = await loop.run_in_executor(None, extract_text, str(path))
        
        # Step 2: Professional Auditor Analysis (Primary)
        from app.auditor_fraud_detector import analyze_document_auditor
        
        # Execute parallel tasks for document understanding
        run_cnn = deep_analysis
        run_donut = deep_analysis
        
        tasks = {}
        if run_cnn:
            tasks['cnn'] = loop.run_in_executor(None, image_risk, str(path))
        
        if run_donut:
            tasks['donut'] = loop.run_in_executor(None, extract_invoice_fields, str(path))
            
        tasks['tabular'] = loop.run_in_executor(None, tabular_risk, ocr_data)
        
        results = {}
        if tasks:
            keys = list(tasks.keys())
            values = list(tasks.values())
            completed = await asyncio.gather(*values)
            results = dict(zip(keys, completed))
            
        image_score = results.get('cnn', 0.1)
        doc_fields = results.get('donut', {})
        tab_score = results.get('tabular', 0.0)
        
        # Run professional auditor analysis with extracted fields
        auditor_result = analyze_document_auditor(ocr_data, doc_fields)
        
        # ████████████████████████████████████████████████████████████████████████
        # ██  EXECUTION GUARD — FINAL AUTHORITY — PRIORITY OVERRIDE            ██
        # ████████████████████████████████████████████████████████████████████████
        #
        # This is the FINAL AUTHORITY in the fraud detection pipeline.
        # When priority_override_active == true:
        #
        # ❌ STOP all further analysis immediately
        # ❌ DO NOT compute or accept any risk score
        # ❌ DO NOT run score fusion
        # ❌ DO NOT apply risk-mapping tables
        # ❌ DO NOT allow MEDIUM or HIGH risk labels
        # ❌ DO NOT let image manipulation upgrade verdict
        #
        # ✅ Return the response immediately
        # ✅ No downstream component may reinterpret this result
        #
        # ████████████████████████████████████████████████████████████████████████
        if auditor_result.get('priority_override_active', False):
            # ═══════════════════════════════════════════════════════════════════
            # EXECUTION TERMINATED — RETURNING LOCKED CLEAN RESULT
            # ═══════════════════════════════════════════════════════════════════
            result = {
                # LOCKED VERDICT — CANNOT BE CHANGED
                "verdict": "REAL",
                "confidence": "HIGH",
                "primary_reason": auditor_result.get('primary_reason', 'Priority Override: Verified invoice'),
                "supporting_evidence": auditor_result.get('supporting_evidence', []),
                "priority_override_active": True,
                "analysis_steps": auditor_result.get('analysis_steps', {}),
                
                # FORCED CLEAN VALUES — IMMUTABLE
                "final_score": 0.05,
                "risk_level": "Low Risk",
                "severity": "Clean",
                
                # Document info
                "filename": file.filename,
                "file_info": file_info,
                "invoice_analysis": {
                    "fraud_indicators": [],  # FORCED EMPTY — NO FRAUD
                    "total_flags": 0,
                    "severity": "Clean"
                },
                "component_scores": {
                    "auditor_analysis": 0.05,
                    "image_manipulation": round(image_score, 3),  # RECORDED but IGNORED
                    "legacy_model": round(tab_score, 3)  # RECORDED but IGNORED
                },
                "recommendations": [],  # FORCED EMPTY — DOC IS CLEAN
                "document_understanding": {
                    "extracted_fields": doc_fields,
                    "validation_flags": []  # FORCED EMPTY — NO ISSUES
                },
                "extracted_text": {
                    "easyocr": ocr_data.get('easyocr_text', '')[:200] + "..." if len(ocr_data.get('easyocr_text', '')) > 200 else ocr_data.get('easyocr_text', ''),
                    "tesseract": ocr_data.get('tesseract_text', '')[:200] + "..." if len(ocr_data.get('tesseract_text', '')) > 200 else ocr_data.get('tesseract_text', '')
                },
                "performance": {
                    "cnn_executed": run_cnn,
                    "donut_executed": run_donut,
                    "cached": False,
                    "priority_override_bypass": True,  # SCORE FUSION WAS BYPASSED
                    "execution_terminated": True  # EXPLICIT TERMINATION FLAG
                }
            }
            
            RESULTS_CACHE[file_hash] = result
            save_cache()
            result["id"] = file_hash
            result["verification_status"] = REVIEW_STATUS.get(file_hash, {}).get("status", "none")
            
            # ═══════════════════════════════════════════════════════════════════
            # IMMEDIATE RETURN — EXECUTION TERMINATES HERE
            # ═══════════════════════════════════════════════════════════════════
            return result
        
        # ════════════════════════════════════════════════════════════════════════
        # NORMAL PROCESSING (only when override NOT active)
        # ════════════════════════════════════════════════════════════════════════
        
        # Extract verdict info
        verdict = auditor_result.get('verdict', 'SUSPICIOUS')
        confidence = auditor_result.get('confidence', 'LOW')
        primary_reason = auditor_result.get('primary_reason', 'Analysis completed')
        supporting_evidence = auditor_result.get('supporting_evidence', [])
        
        # Map verdict to risk level for backward compatibility
        if verdict == "FAKE":
            risk_level = "High Risk"
            combined_score = 0.95
        elif verdict == "SUSPICIOUS":
            risk_level = "Medium Risk"
            combined_score = 0.55 if confidence == "MEDIUM" else 0.45
        else:  # REAL
            risk_level = "Low Risk"
            combined_score = 0.15 if confidence == "HIGH" else 0.25
        
        # ════════════════════════════════════════════════════════════════════════
        # IMPORTANT: Secondary signals can ONLY UPGRADE, never DOWNGRADE
        # ════════════════════════════════════════════════════════════════════════
        # If verdict is FAKE (locked), it CANNOT be changed by any signal
        # If verdict is REAL, image manipulation can upgrade to SUSPICIOUS
        # If verdict is SUSPICIOUS, image manipulation only adjusts score
        # ════════════════════════════════════════════════════════════════════════
        verdict_locked = auditor_result.get('verdict_locked', False)
        
        if not verdict_locked and image_score > 0.7:
            # Only upgrade REAL to SUSPICIOUS - never touch FAKE
            combined_score = max(combined_score, 0.6)
            if verdict == "REAL":
                verdict = "SUSPICIOUS"
                risk_level = "Medium Risk"
                supporting_evidence.append("Image manipulation indicators detected")
        
        from app.risk_reduction import get_risk_reduction_recommendations
        recommendations = get_risk_reduction_recommendations(auditor_result, image_score)

        result = {
            # New auditor-style verdict format
            "verdict": verdict,
            "confidence": confidence,
            "primary_reason": primary_reason,
            "supporting_evidence": supporting_evidence,
            "analysis_steps": auditor_result.get('analysis_steps', {}),
            
            # Legacy compatibility fields
            "final_score": round(combined_score, 3),
            "risk_level": risk_level,
            "filename": file.filename,
            "file_info": file_info,
            "invoice_analysis": {
                "fraud_indicators": auditor_result.get('fraud_indicators', []),
                "total_flags": auditor_result.get('total_flags', 0),
                "severity": auditor_result.get('severity', 'Low')
            },
            "component_scores": {
                "auditor_analysis": round(auditor_result.get('risk_score', 0.0), 3),
                "image_manipulation": round(image_score, 3),
                "legacy_model": round(tab_score, 3)
            },
            "recommendations": recommendations,
            "document_understanding": {
                "extracted_fields": doc_fields,
                "validation_flags": auditor_result.get('analysis_steps', {}).get('step1_hard_invalidity', {}).get('violations', [])
            },
            "extracted_text": {
                "easyocr": ocr_data.get('easyocr_text', '')[:200] + "..." if len(ocr_data.get('easyocr_text', '')) > 200 else ocr_data.get('easyocr_text', ''),
                "tesseract": ocr_data.get('tesseract_text', '')[:200] + "..." if len(ocr_data.get('tesseract_text', '')) > 200 else ocr_data.get('tesseract_text', '')
            },
            "performance": {
                "cnn_executed": run_cnn,
                "donut_executed": run_donut,
                "cached": False
            }
        }
        
        RESULTS_CACHE[file_hash] = result
        save_cache()
        result["performance"]["cached"] = True
        result["id"] = file_hash
        result["filename"] = file.filename
        result["verification_status"] = REVIEW_STATUS.get(file_hash, {}).get("status", "none")
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze-document")
async def analyze_document(file: UploadFile, deep_analysis: bool = Query(True)):
    """
    Universal document analyzer with optimized performance.
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        content = await file.read()
        
        file_hash = calculate_file_hash(content)
        if file_hash in RESULTS_CACHE:
             print(f"Ignoring cache for debug: {file.filename}")
             # return RESULTS_CACHE[file_hash]
            
        path = UPLOAD_DIR / file.filename
        with open(path, "wb") as f:
            f.write(content)
        
        file_info = FileTypeIdentifier.identify_file_type(str(path))
        loop = asyncio.get_event_loop()
        
        # Step 1: OCR (Async)
        ocr_data = await loop.run_in_executor(None, extract_text, str(path))
        
        # Step 2: Detect Type
        from app.document_type_detector import detect_document_type
        doc_type, type_confidence = detect_document_type(ocr_data)
        
        # Step 3: Use auditor-style detection for invoice-type documents
        from app.auditor_fraud_detector import analyze_document_auditor
        
        # For invoice-type documents, use the professional auditor analysis
        use_auditor_analysis = doc_type in ['invoice', 'receipt', 'purchase_order', 'quotation', 'unknown']
        
        if use_auditor_analysis:
            # Run parallel tasks for document understanding
            run_cnn = deep_analysis
            run_struct = deep_analysis
            
            tasks = {}
            if run_cnn:
                tasks['cnn'] = loop.run_in_executor(None, image_risk, str(path))
            if run_struct:
                tasks['struct'] = loop.run_in_executor(None, extract_invoice_fields, str(path))
            tasks['tabular'] = loop.run_in_executor(None, tabular_risk, ocr_data)
            
            results = {}
            if tasks:
                keys = list(tasks.keys())
                values = list(tasks.values())
                completed = await asyncio.gather(*values)
                results = dict(zip(keys, completed))
            
            image_score = results.get('cnn', 0.1)
            doc_fields = results.get('struct', {})
            tab_score = results.get('tabular', 0.0)
            
            # Run professional auditor analysis
            auditor_result = analyze_document_auditor(ocr_data, doc_fields)
            
            # ████████████████████████████████████████████████████████████████████████
            # ██  EXECUTION GUARD — FINAL AUTHORITY — PRIORITY OVERRIDE            ██
            # ████████████████████████████████████████████████████████████████████████
            if auditor_result.get('priority_override_active', False):
                # EXECUTION TERMINATED — RETURNING LOCKED CLEAN RESULT
                result = {
                    "verdict": "REAL",
                    "confidence": "HIGH",
                    "primary_reason": auditor_result.get('primary_reason', 'Priority Override: Verified invoice'),
                    "supporting_evidence": auditor_result.get('supporting_evidence', []),
                    "priority_override_active": True,
                    "analysis_steps": auditor_result.get('analysis_steps', {}),
                    
                    # FORCED CLEAN VALUES — IMMUTABLE
                    "final_score": 0.05,
                    "risk_level": "Low Risk",
                    "severity": "Clean",
                    
                    "document_type": {
                        "detected_type": doc_type,
                        "confidence": round(type_confidence, 3),
                        "description": _get_document_description(doc_type)
                    },
                    "filename": file.filename,
                    "file_info": file_info,
                    "content_analysis": {
                        "fraud_indicators": [],  # FORCED EMPTY
                        "total_flags": 0,
                        "severity": "Clean"
                    },
                    "component_scores": {
                        "auditor_analysis": 0.05,
                        "image_manipulation": round(image_score, 3),  # RECORDED but IGNORED
                        "legacy_model": round(tab_score, 3)
                    },
                    "recommendations": [],  # FORCED EMPTY
                    "document_understanding": {
                        "extracted_fields": doc_fields,
                        "validation_flags": []  # FORCED EMPTY
                    },
                    "extracted_text": {
                        "easyocr": ocr_data.get('easyocr_text', '')[:200] + "..." if len(ocr_data.get('easyocr_text', '')) > 200 else ocr_data.get('easyocr_text', ''),
                        "tesseract": ocr_data.get('tesseract_text', '')[:200] + "..." if len(ocr_data.get('tesseract_text', '')) > 200 else ocr_data.get('tesseract_text', '')
                    },
                    "performance": {
                        "cnn_executed": run_cnn,
                        "donut_executed": run_struct,
                        "doc_type": doc_type,
                        "priority_override_bypass": True,
                        "execution_terminated": True  # EXPLICIT FLAG
                    }
                }
                
                result["id"] = file_hash
                result["filename"] = file.filename
                result["verification_status"] = REVIEW_STATUS.get(file_hash, {}).get("status", "none")
                RESULTS_CACHE[file_hash] = result
                save_cache()
                return result
            
            # ════════════════════════════════════════════════════════════════════════
            # NORMAL PROCESSING (only when override NOT active)
            # ════════════════════════════════════════════════════════════════════════
            
            # Extract verdict info
            verdict = auditor_result.get('verdict', 'SUSPICIOUS')
            confidence = auditor_result.get('confidence', 'LOW')
            primary_reason = auditor_result.get('primary_reason', 'Analysis completed')
            supporting_evidence = auditor_result.get('supporting_evidence', [])
            
            # Map verdict to risk level
            if verdict == "FAKE":
                risk_level = "High Risk"
                combined_score = 0.95
            elif verdict == "SUSPICIOUS":
                risk_level = "Medium Risk"
                combined_score = 0.55 if confidence == "MEDIUM" else 0.45
            else:  # REAL
                risk_level = "Low Risk"
                combined_score = 0.15 if confidence == "HIGH" else 0.25
            
            # ════════════════════════════════════════════════════════════════════════
            # IMPORTANT: Secondary signals can ONLY UPGRADE, never DOWNGRADE
            # ════════════════════════════════════════════════════════════════════════
            # If verdict is FAKE (locked), it CANNOT be changed by any signal
            # If verdict is REAL, image manipulation can upgrade to SUSPICIOUS
            # ════════════════════════════════════════════════════════════════════════
            verdict_locked = auditor_result.get('verdict_locked', False)
            
            if not verdict_locked and image_score > 0.7:
                # Only upgrade REAL to SUSPICIOUS - never touch FAKE
                combined_score = max(combined_score, 0.6)
                if verdict == "REAL":
                    verdict = "SUSPICIOUS"
                    risk_level = "Medium Risk"
                    supporting_evidence.append("Image manipulation indicators detected")
            
            from app.risk_reduction import get_risk_reduction_recommendations
            recommendations = get_risk_reduction_recommendations(auditor_result, image_score)
            
            result = {
                # New auditor-style verdict format
                "verdict": verdict,
                "confidence": confidence,
                "primary_reason": primary_reason,
                "supporting_evidence": supporting_evidence,
                "analysis_steps": auditor_result.get('analysis_steps', {}),
                
                # Legacy compatibility fields
                "final_score": round(combined_score, 3),
                "risk_level": risk_level,
                "document_type": {
                    "detected_type": doc_type,
                    "confidence": round(type_confidence, 3),
                    "description": _get_document_description(doc_type)
                },
                "filename": file.filename,
                "file_info": file_info,
                "content_analysis": {
                    "fraud_indicators": auditor_result.get('fraud_indicators', []),
                    "total_flags": auditor_result.get('total_flags', 0),
                    "severity": auditor_result.get('severity', 'Low')
                },
                "component_scores": {
                    "auditor_analysis": round(auditor_result.get('risk_score', 0.0), 3),
                    "image_manipulation": round(image_score, 3),
                    "legacy_model": round(tab_score, 3)
                },
                "recommendations": recommendations,
                "document_understanding": {
                    "extracted_fields": doc_fields,
                    "validation_flags": auditor_result.get('analysis_steps', {}).get('step1_hard_invalidity', {}).get('violations', [])
                },
                "extracted_text": {
                    "easyocr": ocr_data.get('easyocr_text', '')[:200] + "..." if len(ocr_data.get('easyocr_text', '')) > 200 else ocr_data.get('easyocr_text', ''),
                    "tesseract": ocr_data.get('tesseract_text', '')[:200] + "..." if len(ocr_data.get('tesseract_text', '')) > 200 else ocr_data.get('tesseract_text', '')
                },
                "performance": {
                    "cnn_executed": run_cnn,
                    "donut_executed": run_struct,
                    "doc_type": doc_type
                }
            }
        else:
            # Use specialized detectors for non-invoice documents
            if doc_type == 'bank_statement':
                from app.bank_statement_fraud_detector import analyze_bank_statement_fraud
                content_analysis = analyze_bank_statement_fraud(ocr_data)
            elif doc_type == 'utility_bill':
                from app.specialized_fraud_detectors import UtilityBillDetector
                content_analysis = UtilityBillDetector().analyze(ocr_data)
            elif doc_type == 'payment_proof':
                from app.specialized_fraud_detectors import PaymentProofDetector
                content_analysis = PaymentProofDetector().analyze(ocr_data)
            elif doc_type == 'tax_document':
                from app.specialized_fraud_detectors import TaxDocumentDetector
                content_analysis = TaxDocumentDetector().analyze(ocr_data)
            elif doc_type == 'payroll':
                from app.specialized_fraud_detectors import PayrollDetector
                content_analysis = PayrollDetector().analyze(ocr_data)
            elif doc_type == 'agreement':
                from app.specialized_fraud_detectors import AgreementDetector
                content_analysis = AgreementDetector().analyze(ocr_data)
            else:
                from app.base_fraud_detector import BaseFinancialDocumentDetector
                content_analysis = BaseFinancialDocumentDetector().analyze(ocr_data)
            
            heuristic_score = content_analysis.get('risk_score', 0.0)
            
            # Run CNN for all documents
            tasks = {'cnn': loop.run_in_executor(None, image_risk, str(path))}
            tasks['tabular'] = loop.run_in_executor(None, tabular_risk, ocr_data)
            
            keys = list(tasks.keys())
            values = list(tasks.values())
            completed = await asyncio.gather(*values)
            results = dict(zip(keys, completed))
            
            image_score = results.get('cnn', 0.1)
            tab_score = results.get('tabular', 0.0)
            
            combined_score = 0.30 * heuristic_score + 0.40 * image_score + 0.30 * tab_score
            
            if combined_score > 0.7:
                risk_level = "High Risk"
                verdict = "SUSPICIOUS"
                confidence = "HIGH"
            elif combined_score > 0.4:
                risk_level = "Medium Risk"
                verdict = "SUSPICIOUS"
                confidence = "MEDIUM"
            else:
                risk_level = "Low Risk"
                verdict = "REAL"
                confidence = "MEDIUM"
            
            from app.risk_reduction import get_risk_reduction_recommendations
            recommendations = get_risk_reduction_recommendations(content_analysis, image_score)
            
            result = {
                "verdict": verdict,
                "confidence": confidence,
                "primary_reason": "Analysis based on specialized document detector",
                "supporting_evidence": [f.get('description', '') for f in content_analysis.get('fraud_indicators', [])[:5]],
                "final_score": round(combined_score, 3),
                "risk_level": risk_level,
                "document_type": {
                    "detected_type": doc_type,
                    "confidence": round(type_confidence, 3),
                    "description": _get_document_description(doc_type)
                },
                "filename": file.filename,
                "file_info": file_info,
                "content_analysis": {
                    "fraud_indicators": content_analysis.get('fraud_indicators', []),
                    "total_flags": content_analysis.get('total_flags', 0),
                    "severity": content_analysis.get('severity', 'Low')
                },
                "component_scores": {
                    "content_specific": round(heuristic_score, 3),
                    "image_manipulation": round(image_score, 3),
                    "legacy_model": round(tab_score, 3)
                },
                "recommendations": recommendations,
                "extracted_text": {
                    "easyocr": ocr_data.get('easyocr_text', '')[:200] + "..." if len(ocr_data.get('easyocr_text', '')) > 200 else ocr_data.get('easyocr_text', ''),
                    "tesseract": ocr_data.get('tesseract_text', '')[:200] + "..." if len(ocr_data.get('tesseract_text', '')) > 200 else ocr_data.get('tesseract_text', '')
                },
                "performance": {
                    "cnn_executed": True,
                    "doc_type": doc_type
                }
            }

        result["id"] = file_hash
        result["filename"] = file.filename
        result["verification_status"] = REVIEW_STATUS.get(file_hash, {}).get("status", "none")
        RESULTS_CACHE[file_hash] = result
        save_cache()
        return result
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

def _get_document_description(doc_type: str) -> str:
    """Get human-readable description of document type"""
    descriptions = {
        'invoice': 'Commercial invoice for goods or services',
        'receipt': 'Purchase receipt from merchant',
        'bank_statement': 'Bank account statement',
        'purchase_order': 'Purchase order document',
        'expense_report': 'Employee expense reimbursement report',
        'check': 'Bank check or cheque',
        'utility_bill': 'Utility service bill (Electricity, Water, etc.)',
        'quotation': 'Vendor quotation or price estimate',
        'payment_proof': 'Proof of payment (Receipt, Screenshot, UTR)',
        'tax_document': 'Tax compliance document (GST, VAT, Challan)',
        'payroll': 'Payroll document (Salary slip, Paysheet)',
        'agreement': 'Financial agreement or contract',
        'unknown': 'Financial document (type could not be determined)'
    }
    return descriptions.get(doc_type, 'Unknown financial document')

# --- Forensic Review Endpoints ---

from pydantic import BaseModel

class ReviewAction(BaseModel):
    action: str  # 'request', 'confirm', 'reject'
    comment: str = ""

@app.post("/api/review/{file_id}")
async def submit_review(file_id: str, review: ReviewAction):
    if file_id not in RESULTS_CACHE:
        raise HTTPException(status_code=404, detail="Result not found")
    
    current_status = REVIEW_STATUS.get(file_id, {}).get("status", "none")
    
    if review.action == "request":
        # User requesting verification
        REVIEW_STATUS[file_id] = {
            "status": "pending",
            "requested_at": "Just now", # In real app, use datetime
            "comments": []
        }
        save_reviews()
        return {"status": "pending", "message": "Verification requested"}
        
    elif review.action in ["confirm", "reject"]:
        # Expert decision
        # Ideally check for auth here, but for this demo effectively open or relies on frontend hiding
        new_status = "verified" if review.action == "confirm" else "rejected"
        
        REVIEW_STATUS[file_id] = {
            "status": new_status,
            "reviewed_at": "Just now",
            "comment": review.comment
        }
        save_reviews()
        return {"status": new_status, "message": f"Review {new_status}"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@app.get("/api/reviews/pending")
async def get_pending_reviews():
    """Get all documents pending forensic review"""
    pending = []
    for file_id, meta in REVIEW_STATUS.items():
        if meta.get("status") == "pending":
            if file_id in RESULTS_CACHE:
                result = RESULTS_CACHE[file_id]
                # Add metadata to the result summary
                summary = {
                    "id": file_id,
                    "filename": result.get("filename", "Unknown"),
                    "risk_level": result.get("risk_level"),
                    "score": result.get("final_score"),
                    "uploaded_at": meta.get("requested_at")
                }
                pending.append(summary)
    return pending

@app.get("/api/result/{file_id}")
async def get_result_by_id(file_id: str):
    if file_id in RESULTS_CACHE:
        res = RESULTS_CACHE[file_id]
        res["id"] = file_id
        res["verification_status"] = REVIEW_STATUS.get(file_id, {}).get("status", "none")
        res["review_comment"] = REVIEW_STATUS.get(file_id, {}).get("comment", "")
        return res
    raise HTTPException(status_code=404, detail="Not found")
