"""
Bank Statement Fraud Detector
Specialized fraud detection for bank statements
"""
from app.base_fraud_detector import BaseFinancialDocumentDetector
import re
from typing import Dict, Any


class BankStatementFraudDetector(BaseFinancialDocumentDetector):
    """Detects fraud indicators specific to bank statements"""
    
    def __init__(self):
        super().__init__()
        self.document_type = "bank_statement"
    
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        """Analyze bank statement for fraud indicators"""
        # Run base checks first
        result = super().analyze(ocr_data, doc_data)
        
        # Get combined text
        text = ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')
        text = text.lower()
        
        # Bank statement-specific checks
        self._check_bank_info(text)
        self._check_account_number(text)
        self._check_transaction_patterns(text)
        self._check_balance_consistency(text)
        
        # Recalculate score
        self._calculate_risk_score()
        
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }
    
    def _check_bank_info(self, text: str):
        """Verify bank information is present"""
        bank_indicators = ['bank', 'statement', 'account', 'balance']
        
        found = sum(1 for indicator in bank_indicators if indicator in text)
        
        if found < 2:
            self.fraud_indicators.append({
                'type': 'missing_bank_info',
                'severity': 'high',
                'description': 'Missing standard bank statement elements'
            })
    
    def _check_account_number(self, text: str):
        """Check for account number presence and format"""
        # Look for account number patterns
        account_patterns = [
            r'account\s*#?\s*\d{4,}',
            r'acct\s*#?\s*\d{4,}',
            r'\d{10,16}'  # Typical account number length
        ]
        
        has_account = any(re.search(pattern, text, re.IGNORECASE) for pattern in account_patterns)
        
        if not has_account:
            self.fraud_indicators.append({
                'type': 'missing_account_number',
                'severity': 'high',
                'description': 'No account number found on statement'
            })
    
    def _check_transaction_patterns(self, text: str):
        """Analyze transaction patterns for anomalies"""
        # Extract all monetary amounts
        amounts = re.findall(r'\$?\s*(\d+[.,]\d{2})', text)
        
        if len(amounts) < 3:
            self.fraud_indicators.append({
                'type': 'few_transactions',
                'severity': 'medium',
                'description': 'Very few transactions found - unusual for bank statement'
            })
        
        # Check for suspiciously similar amounts
        if len(amounts) > 5:
            try:
                float_amounts = [float(a.replace(',', '')) for a in amounts]
                unique_amounts = len(set(float_amounts))
                
                if unique_amounts < len(float_amounts) * 0.3:
                    self.fraud_indicators.append({
                        'type': 'repetitive_amounts',
                        'severity': 'medium',
                        'description': 'Many transactions have identical amounts - suspicious pattern'
                    })
            except ValueError:
                pass
    
    def _check_balance_consistency(self, text: str):
        """Check if balances are mentioned and consistent"""
        balance_keywords = ['balance', 'total', 'ending balance', 'beginning balance']
        
        has_balance = any(keyword in text for keyword in balance_keywords)
        
        if not has_balance:
            self.fraud_indicators.append({
                'type': 'missing_balance',
                'severity': 'medium',
                'description': 'No balance information found'
            })


def analyze_bank_statement_fraud(ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
    """Convenience function for bank statement fraud analysis"""
    detector = BankStatementFraudDetector()
    return detector.analyze(ocr_data, doc_data)
