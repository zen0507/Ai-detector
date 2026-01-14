"""
Receipt Fraud Detector
Specialized fraud detection for receipts
"""
from app.base_fraud_detector import BaseFinancialDocumentDetector
import re
from typing import Dict, Any


class ReceiptFraudDetector(BaseFinancialDocumentDetector):
    """Detects fraud indicators specific to receipts"""
    
    def __init__(self):
        super().__init__()
        self.document_type = "receipt"
    
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        """Analyze receipt for fraud indicators"""
        # Run base checks first
        result = super().analyze(ocr_data, doc_data)
        
        # Get combined text
        text = ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')
        text = text.lower()
        
        # Receipt-specific checks
        self._check_receipt_structure(text)
        self._check_merchant_info(text)
        self._check_item_consistency(text)
        self._check_duplicate_items(text)
        
        # Recalculate score with new indicators
        self._calculate_risk_score()
        
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }
    
    def _check_receipt_structure(self, text: str):
        """Check if receipt has standard structure"""
        required_elements = {
            'merchant': r'(store|shop|restaurant|cafe|market)',
            'total': r'(total|amount|sum)',
            'payment': r'(cash|card|credit|debit|paid)'
        }
        
        missing = []
        for element, pattern in required_elements.items():
            if not re.search(pattern, text, re.IGNORECASE):
                missing.append(element)
        
        if len(missing) >= 2:
            self.fraud_indicators.append({
                'type': 'incomplete_receipt',
                'severity': 'medium',
                'description': f'Missing standard receipt elements: {", ".join(missing)}'
            })
    
    def _check_merchant_info(self, text: str):
        """Verify merchant information"""
        # Check for generic merchant names
        generic_names = ['store', 'shop', 'market', 'restaurant']
        
        for name in generic_names:
            if name in text and len(text) < 100:
                self.fraud_indicators.append({
                    'type': 'generic_merchant',
                    'severity': 'medium',
                    'description': f'Generic merchant name: {name}'
                })
                break
    
    def _check_item_consistency(self, text: str):
        """Check if items and amounts make sense"""
        # Extract all amounts
        amounts = re.findall(r'\$?\s*(\d+[.,]\d{2})', text)
        
        if len(amounts) < 2:
            self.fraud_indicators.append({
                'type': 'missing_items',
                'severity': 'low',
                'description': 'Receipt appears to have very few items'
            })
    
    def _check_duplicate_items(self, text: str):
        """Check for suspiciously duplicated line items"""
        lines = text.split('\n')
        
        # Simple duplicate detection
        seen_lines = {}
        for line in lines:
            line = line.strip()
            if len(line) > 10:  # Ignore very short lines
                if line in seen_lines:
                    seen_lines[line] += 1
                else:
                    seen_lines[line] = 1
        
        duplicates = {line: count for line, count in seen_lines.items() if count > 2}
        
        if duplicates:
            self.fraud_indicators.append({
                'type': 'duplicate_lines',
                'severity': 'low',
                'description': f'Found {len(duplicates)} duplicated line items'
            })


def analyze_receipt_fraud(ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
    """Convenience function for receipt fraud analysis"""
    detector = ReceiptFraudDetector()
    return detector.analyze(ocr_data, doc_data)
