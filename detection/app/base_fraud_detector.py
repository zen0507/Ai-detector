"""
Base Financial Document Fraud Detector
Provides common fraud detection functionality for all financial documents
"""
from typing import Dict, List, Any
import re
from datetime import datetime


class BaseFinancialDocumentDetector:
    """Base class for all financial document fraud detectors"""
    
    def __init__(self):
        self.fraud_indicators = []
        self.risk_score = 0.0
        self.document_type = "unknown"
        
    def analyze(self, ocr_data: Dict[str, str], doc_data: Any = None) -> Dict[str, Any]:
        """
        Base analysis method - override in subclasses
        
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
        
        # Run common checks
        self._check_text_quality(text)
        self._check_date_validity(text)
        self._check_amount_patterns(text)
        self._check_urgency_indicators(text)
        
        # Calculate risk score
        self._calculate_risk_score()
        
        return {
            'document_type': self.document_type,
            'fraud_indicators': self.fraud_indicators,
            'risk_score': self.risk_score,
            'total_flags': len(self.fraud_indicators),
            'severity': self._get_severity_level()
        }
    
    def _check_text_quality(self, text: str):
        """Check for poor OCR quality or suspicious text patterns"""
        if len(text) < 20:
            self.fraud_indicators.append({
                'type': 'insufficient_text',
                'severity': 'medium',
                'description': 'Very little text extracted - possible blank or low-quality document'
            })
        
        # Check for excessive repetition
        words = text.split()
        if len(words) > 10:
            unique_ratio = len(set(words)) / len(words)
            if unique_ratio < 0.3:
                self.fraud_indicators.append({
                    'type': 'repetitive_content',
                    'severity': 'medium',
                    'description': 'Highly repetitive text - possible template fraud'
                })
    
    def _check_date_validity(self, text: str):
        """Check for date-related anomalies"""
        date_patterns = re.findall(r'(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})', text)
        
        for date_match in date_patterns:
            try:
                month, day, year = map(int, date_match)
                if year < 100:
                    year += 2000
                
                doc_date = datetime(year, month, day)
                
                # Check for future dates
                if doc_date > datetime.now():
                    self.fraud_indicators.append({
                        'type': 'future_date',
                        'severity': 'high',
                        'description': f'Document dated in the future: {month}/{day}/{year}'
                    })
                
                # Check for very old dates (> 5 years)
                years_old = (datetime.now() - doc_date).days / 365
                if years_old > 5:
                    self.fraud_indicators.append({
                        'type': 'very_old_date',
                        'severity': 'low',
                        'description': f'Document dated {int(years_old)} years ago'
                    })
            except ValueError:
                pass
    
    def _check_amount_patterns(self, text: str):
        """Check for suspicious monetary amounts"""
        amounts = re.findall(r'\$?\s*(\d+[.,]\d{2})', text)
        
        for amount_str in amounts:
            try:
                amount = float(amount_str.replace(',', ''))
                
                # Check for suspiciously round numbers
                if amount >= 1000 and amount % 1000 == 0:
                    self.fraud_indicators.append({
                        'type': 'round_amount',
                        'value': amount,
                        'severity': 'low',
                        'description': f'Suspiciously round amount: ${amount:,.2f}'
                    })
            except ValueError:
                pass
    
    def _check_urgency_indicators(self, text: str):
        """Check for social engineering / urgency tactics"""
        urgency_keywords = ['urgent', 'immediate', 'asap', 'final notice', 'overdue', 
                           'legal action', 'suspend', 'terminate', 'act now']
        
        found_keywords = [kw for kw in urgency_keywords if kw in text]
        
        if len(found_keywords) >= 2:
            self.fraud_indicators.append({
                'type': 'urgency_pressure',
                'severity': 'medium',
                'description': f'Multiple urgency keywords found: {", ".join(found_keywords)}'
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
        
        self.risk_score = min(total_score, 1.0)
    
    def _get_severity_level(self) -> str:
        """Get overall severity level"""
        if self.risk_score < 0.3:
            return 'Low Risk'
        elif self.risk_score < 0.6:
            return 'Medium Risk'
        else:
            return 'High Risk'
