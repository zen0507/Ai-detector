"""
Document Type Detector
Automatically detects the type of financial document from OCR text
"""
import re
from typing import Dict, Tuple


class DocumentTypeDetector:
    """Detects the type of financial document"""
    
    @staticmethod
    def detect_document_type(ocr_data: Dict[str, str]) -> Tuple[str, float]:
        """
        Detect document type from OCR text
        
        Args:
            ocr_data: Dictionary with 'easyocr_text' and 'tesseract_text'
            
        Returns:
            Tuple of (document_type, confidence_score)
        """
        text = ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')
        text = text.lower()
        
        # Define keywords for each document type
        type_keywords = {
            'invoice': {
                'keywords': ['invoice', 'bill to', 'ship to', 'invoice number', 'invoice #', 
                           'due date', 'payment terms', 'vendor', 'po number', 'tax invoice', 'sales invoice'],
                'weight': 1.0
            },
            'receipt': {
                'keywords': ['receipt', 'thank you', 'cashier', 'change', 'tender', 
                           'transaction', 'merchant', 'store', 'payment made'],
                'weight': 1.0
            },
            'bank_statement': {
                'keywords': ['bank statement', 'account statement', 'beginning balance', 
                           'ending balance', 'deposits', 'withdrawals', 'account number', 'credit card statement'],
                'weight': 1.0
            },
            'purchase_order': {
                'keywords': ['purchase order', 'po number', 'po#', 'requisition', 
                           'ordered by', 'ship to', 'deliver to'],
                'weight': 1.2
            },
            'expense_report': {
                'keywords': ['expense report', 'reimbursement', 'expenses', 'employee', 
                           'department', 'travel', 'meals'],
                'weight': 1.0
            },
            'check': {
                'keywords': ['pay to the order of', 'check', 'routing number', 'account number',
                           'memo', 'dollars', 'signature'],
                'weight': 1.0
            },
            'utility_bill': {
                'keywords': ['electricity bill', 'water bill', 'gas bill', 'internet bill', 'utility', 
                           'connection number', 'consumer number', 'meter reading', 'bill date', 'due date'],
                'weight': 1.2
            },
            'quotation': {
                'keywords': ['quotation', 'estimate', 'quote', 'proposal', 'valid until', 'estimated cost', 'quote #'],
                'weight': 1.2
            },
            'payment_proof': {
                'keywords': ['payment successful', 'transaction successful', 'upi', 'reference id', 'ref no', 
                           'transfer details', 'payment confirmation', 'transferred', 'screenshot'],
                'weight': 1.2
            },
            'tax_document': {
                'keywords': ['gst challan', 'vat return', 'tax payment', 'form 16', 'income tax', 'tds certificate', 'challan no'],
                'weight': 1.2
            },
            'payroll': {
                'keywords': ['payslip', 'salary slip', 'earnings', 'deductions', 'net pay', 'basic pay', 'hra', 'provident fund'],
                'weight': 1.2
            },
            'agreement': {
                'keywords': ['agreement', 'contract', 'loan agreement', 'memorandum', 'identure', 'parties', 
                           'witnesseth', 'whereas', 'signature of parties'],
                'weight': 1.2
            }
        }
        
        # Calculate scores for each type
        scores = {}
        for doc_type, config in type_keywords.items():
            keywords = config['keywords']
            weight = config['weight']
            
            # Count keyword matches
            matches = sum(1 for keyword in keywords if keyword in text)
            
            # Calculate confidence score
            confidence = (matches / len(keywords)) * weight
            scores[doc_type] = confidence
        
        # Find best match
        if not scores or max(scores.values()) == 0:
            return 'unknown', 0.0
        
        best_type = max(scores, key=scores.get)
        confidence = scores[best_type]
        
        # If confidence is too low, return unknown
        if confidence < 0.15:
            return 'unknown', confidence
        
        return best_type, confidence


def detect_document_type(ocr_data: Dict[str, str]) -> Tuple[str, float]:
    """Convenience function for document type detection"""
    detector = DocumentTypeDetector()
    return detector.detect_document_type(ocr_data)
