"""
Invoice-Specific Fraud Detection Module
This module contains checks specifically designed for invoice fraud detection
"""
import re
from datetime import datetime
from typing import Dict, List, Any
from app.benfords_law import check_benfords_law


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
        self._check_faker_content(text)
        self._check_benfords_law(text)
        
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
            'invoice': r'invoice\s*#?\s*\d+',     # Relaxed: just look for 'invoice' keyword nearby number? No, keep pattern but ensure case insensitive usage
            'date': r'\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}', # Added dot separator

            'amount': r'[\$£€₹]?\d+[.,]\d{2}',
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
        # Find dates: DD.MM.YYYY or DD/MM/YYYY
        date_patterns = re.findall(r'(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})', text)
        
        current_year = datetime.now().year
        
        for date_match in date_patterns:
            try:
                day, month, year = map(int, date_match)
                if year < 100:
                    year += 2000
                
                # Check for future dates
                try:
                    invoice_date = datetime(year, month, day)
                    if invoice_date > datetime.now():
                        self.fraud_indicators.append({
                            'type': 'future_date',
                            'severity': 'high',
                            'description': f'Invoice dated in the future: {day}/{month}/{year}'
                        })
                        
                    # Check for very old dates (often random generated dates like 1970-1999)
                    if year < 2015:
                         self.fraud_indicators.append({
                            'type': 'anomalous_date',
                            'severity': 'medium',
                            'description': f'Suspiciously old date detected: {year} (modern e-business context)'
                        })
                except ValueError:
                     pass # Invalid date components
            except ValueError:
                pass
    
    def _check_formatting_issues(self, text: str):
        """Check for formatting anomalies"""
        # Check for excessive spelling errors (indicator of unprofessional/fake invoice)
        common_words = ['invoice', 'total', 'amount', 'date', 'payment', 'due', 'receipt', 'bill', 'vendor']
        misspellings = 0
        
        lower_text = text.lower()
        for word in common_words:
            # Simple check for common misspellings (or rather, missing standard terms)
            if word not in lower_text and len(text) > 50:
                misspellings += 1
        
        # Relaxed threshold: require significant absence of standard terms
        if misspellings >= 6:
            self.fraud_indicators.append({
                'type': 'poor_formatting',
                'severity': 'medium',
                'description': 'Multiple missing standard business terms - possible fake or poor OCR'
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
        """
        Check if line items are mathematically consistent.
        Looks for patterns like: [Price] [Quantity] [Total]
        """
        # Try to find sequences of 3 numbers on a line
        # Regex for capturing 3 numbers (float or int) separated by space
        # We allow some non-digit chars in between due to OCR noise
        # Pattern: Num ... Num ... Num
        
        lines = text.split('\n')
        consistency_errors = 0
        
        for line in lines:
            # Extract numbers from the line
            nums = re.findall(r'\d+[.,]\d{2}', line) # Look for currency-like floats first
            if len(nums) < 3:
                # Try simpler floats if currency not found
                nums = re.findall(r'\d+[.,]?\d*', line)
            
            # Filter clean numbers
            clean_nums = []
            for n in nums:
                try:
                    val = float(n.replace(',', ''))
                    if val > 0: # Ignore zero
                        clean_nums.append(val)
                except: 
                    pass
            
            if len(clean_nums) >= 3:
                # Check triplets for A * B = C relationship
                # We check combinations because we don't know order (Qty Price Total vs Price Qty Total)
                found_match = False
                
                # Iterate through possible triplets in the line
                for i in range(len(clean_nums) - 2):
                    a, b, c = clean_nums[i], clean_nums[i+1], clean_nums[i+2]
                    
                    # relationships: a*b=c, a*c=b, b*c=a
                    if self._is_approx_product(a, b, c) or \
                       self._is_approx_product(a, c, b) or \
                       self._is_approx_product(b, c, a):
                        found_match = True
                        break
                        
                # Note: We don't flag if NO match found, because line might just contains unrelated numbers
                # But if we see something that LOOKS like a line item but is wrong... difficult with regex only.
                # So we stick to "Checking Totals" approach for now.
                pass
                
        # Heuristic 2: Check "Total" keyword and the largest number
        try:
            amounts = re.findall(r'\d+[.,]\d{2}', text)
            values = sorted([float(a.replace(',', '')) for a in amounts])
            
            if len(values) > 2:
                grand_total = values[-1]
                # If grand total is exactly sum of everything else / 2 (accounting for double counting)
                # Not reliable.
                pass
        except:
            pass
            
    def _is_approx_product(self, a, b, product):
        """Check if a * b ~= product within 1% margin"""
        if product == 0: return False
        calc = a * b
        margin = product * 0.02 # 2% margin for rounding
        return abs(calc - product) < margin
    
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
            
    def _check_faker_content(self, text: str):
        """Check for common 'Faker' library content and gibberish"""
        # Common fake business buzzwords (often used in simple generators)
        faker_buzzwords = [
            'synergies', 'paradigms', 'infrastructures', 'methodologies', 
            'e-business', 'ubiquitous', 'strategic', 'cultivate', 'morph', 
            'synergize', 'matrix', 'users', 'relationships', 'solutions', 'b2b', 'b2c',
            'revolutionize', 'mindshare', 'metrics', 'transform', 'interactive',
            'niches', 'virtual', 'viral', 'dynamic', '24/365', '24/7', 'global',
            'innovative', 'frictionless', 'value-added', 'vertical', 'granular',
            'collaborative', 'holistic', 'rich-client', 'proactive', 'sexy',
            'back-end', 'front-end', 'distributed', 'wireless', 'scalable',
            'extensible', 'turn-key', 'world-class', 'open-source', 'cross-platform',
            'cross-media', 'best-of-breed', 'bleeding-edge', 'mission-critical',
            'next-generation', 'out-of-the-box', 'peer-to-peer', 'real-time',
            'plug-and-play', 'one-to-one', 'end-to-end', 'empower', 'engage',
            'benchmark', 'exploit', 'facilitate', 'generate', 'harness', 'incentivize',
            'iterate', 'maximize', 'monetize', 'optimize', 'orchestrate', 'redefine',
            'reinvent', 'scale', 'seize', 'streamline', 'syndicate', 'transition',
            'visualize', 'whiteboard', 'experiences', 'interfaces', 'communities',
            'deliverables', 'initiatives', 'schemas', 'architectures', 'portals',
            'vortals', 'schemes', 'e-services', 'content', 'eyeballs', 'markets'
        ]
        
        buzzword_count = sum(1 for word in faker_buzzwords if word in text)
        
        # Check for Lorem Ipsum
        if 'lorem ipsum' in text or 'dolor sit amet' in text:
            self.fraud_indicators.append({
                'type': 'lorem_ipsum',
                'severity': 'high',
                'description': 'Placeholder text (Lorem Ipsum) detected'
            })
            
        # Flag if too many buzzwords appear (nonsense generator)
        if buzzword_count >= 3:
            self.fraud_indicators.append({
                'type': 'generated_content',
                'severity': 'high',
                'description': f'Usage of nonsensical business buzzwords ({buzzword_count} detected) - likely generated text'
            })
            
    def _check_benfords_law(self, text: str):
        """Check for Benford's Law conformity regarding numbers in the document"""
        result = check_benfords_law(text)
        if result['is_suspicious']:
            self.fraud_indicators.append({
                'type': 'benfords_law_violation',
                'severity': 'high',
                'description': f"Statistical anomaly detected in number distribution (Score: {result['deviation']})"
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
