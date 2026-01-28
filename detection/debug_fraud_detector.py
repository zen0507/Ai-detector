from app.ocr import extract_text
from app.invoice_fraud_detector import analyze_invoice_fraud
from app.document_type_detector import detect_document_type
import json

image_path = r'c:/AiDet/detection/uploads/007.png'

print("=== EXTRACTING TEXT ===")
ocr_data = extract_text(image_path)
print(f"EasyOCR length: {len(ocr_data.get('easyocr_text', ''))}")
print(f"Tesseract length: {len(ocr_data.get('tesseract_text', ''))}")
print(f"\nEasyOCR text: {ocr_data.get('easyocr_text', '')[:500]}")

print("\n=== DETECTING DOCUMENT TYPE ===")
doc_type, confidence = detect_document_type(ocr_data)
print(f"Type: {doc_type}, Confidence: {confidence}")

print("\n=== ANALYZING FOR FRAUD (INVOICE) ===")
fraud_result = analyze_invoice_fraud(ocr_data)
print(json.dumps(fraud_result, indent=2))
