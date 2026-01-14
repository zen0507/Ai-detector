"""
Invoice-Specific Fraud Detection Module
This module contains checks specifically designed for invoice fraud detection
"""
import re
from datetime import datetime
from typing import Dict, List, Any


class InvoiceFraudDetector:
    """Detects fraud indicators specific to invoices"""
    
    def __init__(self):
        self.fraud_indicators = []
        self.risk_score = 0.0
        
    def analyze_invoice(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        """
        Comprehensive invoice fraud analysis
        
        Args:
            ocr_data: Dictionary with 'easyocr_text' and 'tesseract_text'
            doc_data: Optional document understanding data
            
        Returns:
            Dictionary with fraud analysis results
        """
        self.fraud_indicators = []
        self.risk_score = 0.0
        
        # Combine OCR text
        text = ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')
        text = text.lower()
        
        # Run all fraud checks
        self._check_missing_fields(text)
        self._check_suspicious_amounts(text)
        self._check_date_anomalies(text)
        self._check_formatting_issues(text)
        self._check_vendor_info(text)
        self._check_mathematical_consistency(text)
        self._check_suspicious_patterns(text)
        
        # Calculate final risk score
        self._calculate_risk_score()
        
        return {
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }
    
    def _check_missing_fields(self, text: str):
        """Check for missing critical invoice fields"""
        required_fields = {
            'invoice': r'invoice\s*#?\s*\d+',
            'date': r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',
            'amount': r'\$?\d+[.,]\d{2}',
            'vendor': r'(from|vendor|company|seller)',
        }
        
        for field, pattern in required_fields.items():
            if not re.search(pattern, text, re.IGNORECASE):
                self.fraud_indicators.append({
                    'type': 'missing_field',
                    'field': field,
                    'severity': 'medium',
                    'description': f'Missing critical field: {field}'
                })
    
    def _check_suspicious_amounts(self, text: str):
        """Detect suspicious amount patterns"""
        # Extract amounts
        amounts = re.findall(r'\$?\s*(\d+[.,]\d{2})', text)
        
        for amount_str in amounts:
            amount = float(amount_str.replace(',', ''))
            
            # Check for round numbers (often fraudulent)
            if amount % 1000 == 0 and amount > 1000:
                self.fraud_indicators.append({
                    'type': 'suspicious_amount',
                    'value': amount,
                    'severity': 'low',
                    'description': f'Suspiciously round amount: ${amount:,.2f}'
                })
            
            # Check for amounts just below approval thresholds
            thresholds = [999, 4999, 9999, 24999]
            for threshold in thresholds:
                if threshold - 100 < amount < threshold:
                    self.fraud_indicators.append({
                        'type': 'threshold_gaming',
                        'value': amount,
                        'severity': 'high',
                        'description': f'Amount ${amount:,.2f} suspiciously close to approval threshold ${threshold:,}'
                    })
    
    def _check_date_anomalies(self, text: str):
        """Check for date-related fraud indicators"""
        # Find dates
        date_patterns = re.findall(r'(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})', text)
        
        for date_match in date_patterns:
            try:
                month, day, year = map(int, date_match)
                if year < 100:
                    year += 2000
                
                # Check for future dates
                invoice_date = datetime(year, month, day)
                if invoice_date > datetime.now():
                    self.fraud_indicators.append({
                        'type': 'future_date',
                        'severity': 'high',
                        'description': f'Invoice dated in the future: {month}/{day}/{year}'
                    })
                
                # Check for weekend dates (suspicious for B2B)
                if invoice_date.weekday() >= 5:  # Saturday or Sunday
                    self.fraud_indicators.append({
                        'type': 'weekend_date',
                        'severity': 'low',
                        'description': f'Invoice dated on weekend: {month}/{day}/{year}'
                    })
            except ValueError:
                pass  # Invalid date
    
    def _check_formatting_issues(self, text: str):
        """Check for formatting anomalies"""
        # Check for excessive spelling errors (indicator of unprofessional/fake invoice)
        common_words = ['invoice', 'total', 'amount', 'date', 'payment', 'due']
        misspellings = 0
        
        for word in common_words:
            # Simple check for common misspellings
            if word not in text and len(text) > 50:
                misspellings += 1
        
        if misspellings >= 3:
            self.fraud_indicators.append({
                'type': 'poor_formatting',
                'severity': 'medium',
                'description': 'Multiple missing standard invoice terms - possible fake'
            })
    
    def _check_vendor_info(self, text: str):
        """Check vendor information credibility"""
        # Check for generic/suspicious vendor names
        suspicious_names = ['abc company', 'xyz corp', 'test vendor', 'sample inc']
        
        for name in suspicious_names:
            if name in text:
                self.fraud_indicators.append({
                    'type': 'suspicious_vendor',
                    'severity': 'high',
                    'description': f'Generic/test vendor name detected: {name}'
                })
        
        # Check for missing contact information
        has_email = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        has_phone = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        
        if not has_email and not has_phone:
            self.fraud_indicators.append({
                'type': 'missing_contact',
                'severity': 'medium',
                'description': 'No contact information (email/phone) found'
            })
    
    def _check_mathematical_consistency(self, text: str):
        """Check if amounts add up correctly"""
        # Extract all monetary amounts
        amounts = re.findall(r'\$?\s*(\d+[.,]\d{2})', text)
        
        if len(amounts) >= 3:
            # Simple heuristic: check if last amount could be sum of others
            try:
                values = [float(a.replace(',', '')) for a in amounts]
                total = values[-1]
                subtotal = sum(values[:-1])
                
                # Allow 10% margin for tax/fees
                if abs(total - subtotal) > total * 0.1 and total > 100:
                    self.fraud_indicators.append({
                        'type': 'math_inconsistency',
                        'severity': 'medium',
                        'description': 'Amounts may not add up correctly'
                    })
            except ValueError:
                pass
    
    def _check_suspicious_patterns(self, text: str):
        """Check for known fraudulent patterns"""
        # Check for duplicate/repeated text (copy-paste indicator)
        words = text.split()
        if len(words) > 10:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio < 0.3:
                self.fraud_indicators.append({
                    'type': 'repetitive_content',
                    'severity': 'medium',
                    'description': 'Highly repetitive text - possible template fraud'
                })
        
        # Check for urgency keywords (social engineering)
        urgency_keywords = ['urgent', 'immediate', 'asap', 'overdue', 'final notice']
        urgency_count = sum(1 for keyword in urgency_keywords if keyword in text)
        
        if urgency_count >= 2:
            self.fraud_indicators.append({
                'type': 'urgency_pressure',
                'severity': 'medium',
                'description': 'Multiple urgency keywords - possible social engineering'
            })
    
    def _calculate_risk_score(self):
        """Calculate overall risk score based on indicators"""
        severity_weights = {
            'low': 0.1,
            'medium': 0.25,
            'high': 0.4
        }
        
        total_score = 0.0
        for indicator in self.fraud_indicators:
            severity = indicator.get('severity', 'low')
            total_score += severity_weights.get(severity, 0.1)
        
        # Normalize to 0-1 scale
        self.risk_score = min(total_score, 1.0)
    
    def _get_severity_level(self) -> str:
        """Get overall severity level"""
        if self.risk_score < 0.3:
            return 'Low Risk'
        elif self.risk_score < 0.6:
            return 'Medium Risk'
        else:
            return 'High Risk'


# Convenience function for easy integration
def analyze_invoice_fraud(ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
    """
    Analyze invoice for fraud indicators
    
    Args:
        ocr_data: OCR extracted text
        doc_data: Optional document AI data
        
    Returns:
        Fraud analysis results
    """
    detector = InvoiceFraudDetector()
    return detector.analyze_invoice(ocr_data, doc_data)
