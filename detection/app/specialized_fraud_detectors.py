
"""
Simple specialized fraud detectors for various document types.
Implements detection logic for Purchase Orders, Payment Proofs, Payroll, Agreements, etc.
"""
from app.base_fraud_detector import BaseFinancialDocumentDetector
from typing import Dict, Any
import re

# ==========================================
# Purchase Order Detector
# ==========================================
class PurchaseOrderDetector(BaseFinancialDocumentDetector):
    def __init__(self):
        super().__init__()
        self.document_type = "purchase_order"
        
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        result = super().analyze(ocr_data, doc_data)
        text = (ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')).lower()
        
        # PO Specific: Invoices often confused with POs
        if "invoice" in text and "invoice #" in text:
             self.fraud_indicators.append({
                'type': 'misclassified_document',
                'severity': 'medium',
                'description': 'Document contains strong invoice keywords but was classified as PO'
            })
            
        return self._build_result()

    def _build_result(self):
        self._calculate_risk_score()
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }

# ==========================================
# Utility Bill Detector
# ==========================================
class UtilityBillDetector(BaseFinancialDocumentDetector):
    def __init__(self):
        super().__init__()
        self.document_type = "utility_bill"
        
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        super().analyze(ocr_data, doc_data)
        text = (ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')).lower()
        
        # Check for consumption data
        keywords = ['units', 'reading', 'consumption', 'meter']
        if not any(k in text for k in keywords):
             self.fraud_indicators.append({
                'type': 'missing_consumption_data',
                'severity': 'medium',
                'description': 'Utility bill missing consumption/meter reading details'
            })
            
        return self._build_result()
    
    def _build_result(self):
        self._calculate_risk_score()
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }

# ==========================================
# Payment Proof Detector
# ==========================================
class PaymentProofDetector(BaseFinancialDocumentDetector):
    def __init__(self):
        super().__init__()
        self.document_type = "payment_proof"
        
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        super().analyze(ocr_data, doc_data)
        text = (ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')).lower()
        
        # Check for reference number
        ref_keywords = ['ref no', 'reference', 'transaction id', 'txn id', 'utr']
        if not any(k in text for k in ref_keywords):
             self.fraud_indicators.append({
                'type': 'missing_reference',
                'severity': 'high',
                'description': 'Payment proof missing transaction reference ID'
            })
            
        return self._build_result()

    def _build_result(self):
        self._calculate_risk_score()
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }
        
# ==========================================
# Payroll Detector
# ==========================================
class PayrollDetector(BaseFinancialDocumentDetector):
    def __init__(self):
        super().__init__()
        self.document_type = "payroll"
        
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        super().analyze(ocr_data, doc_data)
        text = (ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')).lower()
        
        # Check for deduction fields
        if "deduction" not in text and "pf" not in text and "tax" not in text:
             self.fraud_indicators.append({
                'type': 'missing_deductions',
                'severity': 'low',
                'description': 'Payslip appears to lack deduction details'
            })
            
        return self._build_result()

    def _build_result(self):
        self._calculate_risk_score()
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }

# ==========================================
# Tax Document Detector
# ==========================================
class TaxDocumentDetector(BaseFinancialDocumentDetector):
    def __init__(self):
        super().__init__()
        self.document_type = "tax_document"
        
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        super().analyze(ocr_data, doc_data)
        text = (ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')).lower()
        
        # Check for Tax ID
        if "gstin" not in text and "pan" not in text and "tan" not in text and "tax id" not in text:
             self.fraud_indicators.append({
                'type': 'missing_tax_id',
                'severity': 'high',
                'description': 'Tax document missing Tax ID/GSTIN/PAN'
            })
            
        return self._build_result()

    def _build_result(self):
        self._calculate_risk_score()
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }

# ==========================================
# Agreement Detector
# ==========================================
class AgreementDetector(BaseFinancialDocumentDetector):
    def __init__(self):
        super().__init__()
        self.document_type = "agreement"
        
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        super().analyze(ocr_data, doc_data)
        text = (ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')).lower()
        
        # Check for signatures/witness
        if "witness" not in text and "signed" not in text:
             self.fraud_indicators.append({
                'type': 'missing_signatures',
                'severity': 'medium',
                'description': 'Agreement appears to miss signature/witness section'
            })
            
        return self._build_result()

    def _build_result(self):
        self._calculate_risk_score()
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }

# ==========================================
# Quotation Detector
# ==========================================
class QuotationDetector(BaseFinancialDocumentDetector):
    def __init__(self):
        super().__init__()
        self.document_type = "quotation"
        
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        super().analyze(ocr_data, doc_data)
        text = (ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')).lower()
        
        # Validity validity
        if "valid" not in text and "expires" not in text:
             self.fraud_indicators.append({
                'type': 'missing_validity',
                'severity': 'low',
                'description': 'Quotation missing validity period'
            })
            
        return self._build_result()

    def _build_result(self):
        self._calculate_risk_score()
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }
