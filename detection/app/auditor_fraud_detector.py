"""
================================================================================
FRAUD DETECTION PIPELINE — FINAL AUTHORITY
================================================================================

You are the FINAL AUTHORITY in the fraud detection pipeline.
Your output is binding and MUST NOT be overridden by any score fusion,
risk mapping, heuristic aggregation, or UI logic.

This system uses a PRIORITY OVERRIDE model.
When an override applies, execution MUST TERMINATE.

================================================================================
🧠 STRICT EXECUTION LOGIC (NON-NEGOTIABLE)
================================================================================

CRITICAL RULE — EXECUTION TERMINATION:

If priority_override_active == true:
- STOP all further analysis immediately
- DO NOT compute or accept any risk score
- DO NOT run score fusion
- DO NOT apply risk-mapping tables
- DO NOT allow MEDIUM or HIGH risk labels
- DO NOT downgrade verdict confidence

You must return the response immediately.
No downstream component is allowed to reinterpret it.

================================================================================
🔍 DECISION FLOW (ENFORCED ORDER)
================================================================================

STEP 0 — PRIORITY OVERRIDE (HIGHEST AUTHORITY)

If ALL of the following are true:
- Seller identity is verified and legitimate
- Tax system matches country
- Banking system matches geography
- All mathematical checks pass
- No hard invalidity rules are triggered

THEN:
- Set verdict = REAL
- Set severity = CLEAN
- Set confidence = HIGH
- Set risk_level = LOW
- Set risk_score <= 0.10
- TERMINATE EXECUTION

⬆️ Nothing after this step is allowed to run.

STEP 1 — HARD INVALIDITY CHECK

Only run if Step 0 did NOT terminate execution.
If ANY hard invalidity exists:
- Set verdict = FAKE
- Set confidence = HIGH
- TERMINATE EXECUTION

STEP 2 — BUSINESS REALISM CHECK

Only run if Step 1 did NOT terminate execution.
If unresolved realism issues exist:
- Set verdict = SUSPICIOUS
- Confidence = MEDIUM or LOW

STEP 3 — SECONDARY SIGNALS (RESTRICTED)

These signals:
- Template similarity
- Benford deviations
- Rounded numbers
- POS-style layouts

MUST NEVER:
- Increase risk for REAL verdicts
- Override Step 0
- Produce MEDIUM risk alone

================================================================================
🚫 FORBIDDEN BEHAVIOR (EXPLICIT)
================================================================================

The following outcomes are FORBIDDEN:
- REAL verdict with MEDIUM risk
- CLEAN invoice with risk_score > 0.20
- Priority override followed by score fusion
- Template similarity contributing to fraud risk
- Retail POS invoices downgraded due to structure

================================================================================
📤 REQUIRED FINAL OUTPUT (LOCKED)
================================================================================

Verdict: REAL | FAKE | SUSPICIOUS
Confidence: HIGH | MEDIUM | LOW
Risk Level: LOW | NONE

Primary Reason: <single authoritative reason>
Supporting Evidence: [...]
"""


import re
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
from app.benfords_law import check_benfords_law


class AuditorFraudDetector:
    """
    Senior Forensic Auditor for Financial Documents.
    
    RESPONSIBILITY: Prevent false CLEAN or LOW RISK verdicts for fraud,
                   AND prevent false MEDIUM/HIGH RISK for legitimate documents.
    
    PRIORITY OVERRIDE RULE (Step 0):
    When a document has verifiable seller, correct tax system, valid IDs,
    and correct math → Force REAL verdict, suppress heuristic penalties.
    
    STRICT ENFORCEMENT RULES:
    - Uncertainty is NOT fraud
    - Template similarity is NOT fraud
    - Retail POS structure is NOT fraud
    - If ANY hard invalidity detected → verdict = FAKE, confidence = HIGH
    - FAKE verdict is FINAL and CANNOT be downgraded
    
    VERDICT PRIORITY (IMMUTABLE):
    0. REAL (forced) → if Step-0 override conditions are ALL met
    1. FAKE → if ANY Step-1 rule triggered (NON-NEGOTIABLE)
    2. SUSPICIOUS → if Step-2 issues exist AND Step-0 override NOT active
    3. REAL → ONLY if Step-1 AND Step-2 are clean
    """
    
    def __init__(self):
        self.step0_override = False
        self.step1_violations = []
        self.step2_issues = []
        self.step3_signals = []
        
    def analyze(self, ocr_data: Dict[str, str], extracted_fields: Dict = None) -> Dict[str, Any]:
        """
        Perform comprehensive 4-step fraud analysis with Priority Override.
        
        Args:
            ocr_data: Dictionary with 'easyocr_text' and 'tesseract_text'
            extracted_fields: Optional structured invoice fields from document AI
            
        Returns:
            Complete analysis result with verdict
        """
        self.step0_override = False
        self.step1_violations = []
        self.step2_issues = []
        self.step3_signals = []
        
        # Combine OCR text
        text = ocr_data.get('easyocr_text', '') + ' ' + ocr_data.get('tesseract_text', '')
        text_lower = text.lower()
        
        # ====================================
        # STEP 1 — HARD INVALIDITY CHECK
        # ====================================
        step1_result = self._step1_hard_invalidity_check(text, text_lower, extracted_fields)
        
        # If FAKE triggered in Step 1, STOP and return immediately
        if step1_result["is_fake"]:
            return self._build_fake_result(step1_result)
        
        # ════════════════════════════════════════════════════════════════════════
        # STEP 0 — PRIORITY OVERRIDE (runs after Step 1 passes)
        # ════════════════════════════════════════════════════════════════════════
        # If all override conditions are met, force REAL verdict
        step0_result = self._step0_priority_override(text, text_lower, extracted_fields)
        self.step0_override = step0_result["override_active"]
        
        # ====================================
        # STEP 2 — BUSINESS REALISM CHECK
        # ====================================
        step2_result = self._step2_business_realism_check(text, text_lower, extracted_fields)
        
        # ====================================
        # STEP 3 — SUPPORTING SIGNALS
        # ====================================
        step3_result = self._step3_supporting_signals(text, text_lower)
        
        # ====================================
        # FINAL VERDICT DETERMINATION
        # ====================================
        return self._determine_final_verdict(step1_result, step2_result, step3_result, step0_result)
    
    def _step0_priority_override(self, text: str, text_lower: str,
                                  extracted_fields: Dict = None) -> Dict[str, Any]:
        """
        ════════════════════════════════════════════════════════════════════════
        STEP 0 — PRIORITY OVERRIDE (CRITICAL)
        ════════════════════════════════════════════════════════════════════════
        
        IF ALL of the following are true:
        - Seller identity is verifiable and legitimate
        - Tax system matches country (e.g., GST in India)
        - Tax IDs are structurally valid
        - Mathematical calculations are correct
        - No hard fraud violations are present (already checked in Step 1)

        THEN:
        - Force verdict = REAL
        - Force severity = CLEAN
        - Suppress all secondary heuristic penalties
        - DO NOT assign MEDIUM or MODERATE risk
        - Ignore template similarity, Benford deviations, missing consumer metadata
        
        This override is mandatory.
        ════════════════════════════════════════════════════════════════════════
        """
        checks_passed = []
        checks_failed = []
        
        # Check 1: Seller identity is verifiable
        has_seller = self._has_verifiable_seller(text_lower)
        if has_seller:
            checks_passed.append("Seller identity is verifiable")
        else:
            checks_failed.append("Seller identity not clearly verifiable")
        
        # Check 2: Tax system matches detected country
        tax_match = self._check_tax_country_match(text_lower)
        if tax_match["matches"]:
            checks_passed.append(f"Tax system matches country ({tax_match['system']} in {tax_match['country']})")
        else:
            if tax_match.get("no_tax_detected"):
                # No tax = not a disqualifier (some invoices are tax-exempt)
                checks_passed.append("No tax system detected (acceptable)")
            else:
                checks_failed.append(tax_match.get("reason", "Tax system mismatch"))
        
        # Check 3: Tax IDs are structurally valid (if present)
        tax_id_result = self._check_tax_id_structure(text_lower)
        if tax_id_result["valid"]:
            checks_passed.append(f"Tax ID structure valid: {tax_id_result['type']}")
        elif tax_id_result.get("no_tax_id"):
            # No tax ID = not a disqualifier for consumer invoices
            checks_passed.append("No tax ID required (consumer invoice)")
        else:
            checks_failed.append(tax_id_result.get("reason", "Invalid tax ID structure"))
        
        # Check 4: Mathematical calculations are correct (already checked in Step 1)
        # If we're here, Step 1 passed, meaning math was correct
        checks_passed.append("Mathematical calculations correct (Step 1 passed)")
        
        # Determine if override should apply
        # Override applies if: seller is verifiable AND tax system matches (if present)
        override_active = has_seller and (tax_match["matches"] or tax_match.get("no_tax_detected", False))
        
        return {
            "override_active": override_active,
            "checks_passed": checks_passed,
            "checks_failed": checks_failed,
            "reason": "Priority override: Valid verified invoice" if override_active else "Override not applicable"
        }
    
    def _has_verifiable_seller(self, text_lower: str) -> bool:
        """Check if seller identity is verifiable (has real business indicators)"""
        # Business name patterns (Inc, LLC, Ltd, Corp, Pvt, etc.)
        has_company = bool(re.search(r'(inc|llc|ltd|corp|company|co\.|gmbh|pvt|private|enterprises|solutions|services|stores?|mart|shop)', text_lower))
        
        # Has address (street address pattern)
        has_address = bool(re.search(r'\d+\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|drive|lane|way|place|circle)', text_lower))
        
        # Has registration/tax ID
        has_registration = bool(re.search(r'(gstin|gst\s*no|vat\s*no|tax\s*id|ein|abn|registration|tin|pan)', text_lower))
        
        # Has phone number
        has_phone = bool(re.search(r'(\+?[\d\s\-]{10,}|phone|tel|contact)', text_lower))
        
        # Has email or website
        has_contact = bool(re.search(r'(@|www\.|\.com|\.in|\.org|\.net)', text_lower))
        
        # Need at least 2 verifiable indicators
        indicators = [has_company, has_address, has_registration, has_phone, has_contact]
        return sum(indicators) >= 2
    
    def _check_tax_country_match(self, text_lower: str) -> Dict[str, Any]:
        """Check if tax system matches the detected country context"""
        
        # Detect country context
        india_indicators = ['india', 'inr', 'rupees', '₹', 'gstin', 'mumbai', 'delhi', 
                           'bangalore', 'bengaluru', 'chennai', 'kolkata', 'hyderabad', 'pune']
        uk_indicators = ['uk', 'united kingdom', 'gbp', 'pound', '£', 'london', 'england', 'scotland', 'wales']
        eu_indicators = ['euro', '€', 'germany', 'france', 'spain', 'italy', 'netherlands', 'belgium']
        usa_indicators = ['usa', 'united states', 'u.s.', 'usd', '$', 'dollar']
        aus_indicators = ['australia', 'aud', 'sydney', 'melbourne', 'brisbane']
        
        is_india = any(ind in text_lower for ind in india_indicators)
        is_uk = any(ind in text_lower for ind in uk_indicators)
        is_eu = any(ind in text_lower for ind in eu_indicators)
        is_usa = any(ind in text_lower for ind in usa_indicators)
        is_aus = any(ind in text_lower for ind in aus_indicators)
        
        # Detect tax system
        has_gst = bool(re.search(r'\bgst\b|\bgstin\b', text_lower))
        has_vat = bool(re.search(r'\bvat\b', text_lower))
        has_sales_tax = 'sales tax' in text_lower
        
        # No tax detected - acceptable for many invoices
        if not has_gst and not has_vat and not has_sales_tax:
            return {"matches": True, "no_tax_detected": True, "system": "none", "country": "unknown"}
        
        # Check GST matches India or Australia
        if has_gst:
            if is_india or is_aus:
                return {"matches": True, "system": "GST", "country": "India/Australia"}
            elif is_usa or is_uk:
                return {"matches": False, "reason": "GST used in USA/UK context"}
        
        # Check VAT matches UK or EU
        if has_vat:
            if is_uk or is_eu:
                return {"matches": True, "system": "VAT", "country": "UK/EU"}
            elif is_usa:
                return {"matches": False, "reason": "VAT used in USA context"}
        
        # Check Sales Tax matches USA
        if has_sales_tax:
            if is_usa:
                return {"matches": True, "system": "Sales Tax", "country": "USA"}
        
        # Default: if we can't clearly determine mismatch, assume match
        return {"matches": True, "system": "unknown", "country": "unknown"}
    
    def _check_tax_id_structure(self, text_lower: str) -> Dict[str, Any]:
        """Check if tax IDs have valid structural format"""
        
        # GSTIN pattern: 15 alphanumeric (2 state + 10 PAN + 1 entity + 1 Z + 1 check)
        gstin_match = re.search(r'\b\d{2}[a-z]{5}\d{4}[a-z]\d[a-z\d]{2}\b', text_lower)
        if gstin_match:
            return {"valid": True, "type": "GSTIN (India)"}
        
        # PAN pattern: 5 letters + 4 digits + 1 letter
        pan_match = re.search(r'\b[a-z]{5}\d{4}[a-z]\b', text_lower)
        if pan_match:
            return {"valid": True, "type": "PAN (India)"}
        
        # VAT number patterns (EU)
        vat_match = re.search(r'\b[a-z]{2}\d{8,12}\b', text_lower)
        if vat_match:
            return {"valid": True, "type": "VAT Number"}
        
        # EIN pattern (USA): XX-XXXXXXX
        ein_match = re.search(r'\b\d{2}-\d{7}\b', text_lower)
        if ein_match:
            return {"valid": True, "type": "EIN (USA)"}
        
        # ABN pattern (Australia): 11 digits
        abn_match = re.search(r'\babn[:\s]*\d{11}\b', text_lower)
        if abn_match:
            return {"valid": True, "type": "ABN (Australia)"}
        
        # No tax ID found - acceptable for consumer invoices
        if not re.search(r'(gstin|gst\s*no|vat\s*no|tax\s*id|ein|abn|tin|pan)', text_lower):
            return {"valid": True, "no_tax_id": True, "type": "None required"}
        
        # Tax ID label present but couldn't validate structure
        return {"valid": False, "reason": "Tax ID present but format not recognized"}
    
    def _step1_hard_invalidity_check(self, text: str, text_lower: str, 
                                      extracted_fields: Dict = None) -> Dict[str, Any]:
        """
        ════════════════════════════════════════════════════════════════════════
        STEP 1 — HARD INVALIDITY CHECK (NON-NEGOTIABLE)
        ════════════════════════════════════════════════════════════════════════
        
        If ANY of the following are true, the document is FAKE:
        - IBAN is present AND seller country is USA
        - VAT is applied AND seller country is USA  
        - Banking system does not match seller geography
        - Tax system does not match seller geography
        - Due date is earlier than issue date
        - Quantity × unit price ≠ line total
        - Subtotal + tax ≠ final total
        - Placeholder or synthetic content is detected
        - Seller or buyer identity is clearly fabricated
        
        IMPORTANT OVERRIDE RULE:
        If ANY rule triggers:
        → Verdict = FAKE
        → Confidence = HIGH
        → STOP further analysis IMMEDIATELY
        → Do NOT consider image scores, risk scores, or any other factors
        
        This verdict CANNOT be downgraded by ANY other signal.
        ════════════════════════════════════════════════════════════════════════
        """
        violations = []
        
        # Check 1: Tax system geography mismatch (VAT in USA, GST in UK, etc.)
        tax_violation = self._check_tax_geography_mismatch(text_lower)
        if tax_violation:
            violations.append(tax_violation)
        
        # Check 2: Banking system geography mismatch (IBAN in USA, Routing# in EU)
        bank_violation = self._check_banking_geography_mismatch(text_lower)
        if bank_violation:
            violations.append(bank_violation)
        
        # Check 3: Date chronology violation (due date < issue date = IMPOSSIBLE)
        date_violation = self._check_date_chronology(text, extracted_fields)
        if date_violation:
            violations.append(date_violation)
        
        # Check 4: Line item math violation (Qty × Unit Price ≠ Line Total)
        line_math_violations = self._check_line_item_math(text, extracted_fields)
        violations.extend(line_math_violations)
        
        # Check 5: Total math violation (Subtotal + Tax ≠ Final Amount)
        total_math_violation = self._check_total_math(text, extracted_fields)
        if total_math_violation:
            violations.append(total_math_violation)
        
        # Check 6: Placeholder/synthetic content (example.com, John Doe, Lorem Ipsum)
        placeholder_violations = self._check_placeholder_content(text_lower)
        violations.extend(placeholder_violations)
        
        # Check 7: AI-generated nonsensical descriptions
        nonsense_violation = self._check_nonsensical_descriptions(text_lower)
        if nonsense_violation:
            violations.append(nonsense_violation)
        
        # Check 8: Fabricated identity (ABC Company, XYZ Corp, Test Vendor)
        identity_violation = self._check_fabricated_identity(text_lower)
        if identity_violation:
            violations.append(identity_violation)
        
        self.step1_violations = violations
        
        # ════════════════════════════════════════════════════════════════════════
        # ANY violation triggers FAKE - this is FINAL and NON-NEGOTIABLE
        # ════════════════════════════════════════════════════════════════════════
        return {
            "is_fake": len(violations) > 0,
            "violations": violations,
            "primary_violation": violations[0] if violations else None,
            "verdict_locked": len(violations) > 0  # Signal that verdict cannot change
        }
    
    def _check_tax_geography_mismatch(self, text_lower: str) -> Optional[Dict]:
        """
        Check if tax system matches the country context.
        
        HARD INVALIDITY TRIGGERS:
        - VAT in USA context → FAKE
        - GST in USA/UK context → FAKE  
        - Sales Tax in EU/UK context → FAKE
        """
        
        # ════════════════════════════════════════════════════════════════════════
        # COMPREHENSIVE USA DETECTION
        # ════════════════════════════════════════════════════════════════════════
        # All 50 US state abbreviations (with word boundaries for accuracy)
        us_state_abbrevs = [
            ' al ', ' ak ', ' az ', ' ar ', ' ca ', ' co ', ' ct ', ' de ', ' fl ', ' ga ',
            ' hi ', ' id ', ' il ', ' in ', ' ia ', ' ks ', ' ky ', ' la ', ' me ', ' md ',
            ' ma ', ' mi ', ' mn ', ' ms ', ' mo ', ' mt ', ' ne ', ' nv ', ' nh ', ' nj ',
            ' nm ', ' ny ', ' nc ', ' nd ', ' oh ', ' ok ', ' or ', ' pa ', ' ri ', ' sc ',
            ' sd ', ' tn ', ' tx ', ' ut ', ' vt ', ' va ', ' wa ', ' wv ', ' wi ', ' wy ',
            ' dc ', ',al ', ',ak ', ',az ', ',ar ', ',ca ', ',co ', ',ct ', ',de ', ',fl ',
            ',ga ', ',hi ', ',id ', ',il ', ',in ', ',ia ', ',ks ', ',ky ', ',la ', ',me ',
            ',md ', ',ma ', ',mi ', ',mn ', ',ms ', ',mo ', ',mt ', ',ne ', ',nv ', ',nh ',
            ',nj ', ',nm ', ',ny ', ',nc ', ',nd ', ',oh ', ',ok ', ',or ', ',pa ', ',ri ',
            ',sc ', ',sd ', ',tn ', ',tx ', ',ut ', ',vt ', ',va ', ',wa ', ',wv ', ',wi ',
            ',wy ', ',dc '
        ]
        
        # US state names
        us_state_names = [
            'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
            'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
            'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
            'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
            'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
            'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina',
            'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania',
            'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas',
            'utah', 'vermont', 'virginia', 'washington', 'west virginia',
            'wisconsin', 'wyoming', 'district of columbia'
        ]
        
        # Direct USA indicators
        usa_direct = ['usa', 'united states', 'u.s.a', 'u.s.', 'usd', 'dollar', 'america']
        
        # US military addresses
        us_military = ['apo ', 'fpo ', 'dpo ', 'apo ap', 'apo ae', 'apo aa']
        
        # US Tax ID patterns (SSN format: XXX-XX-XXXX, EIN format: XX-XXXXXXX)
        has_us_tax_pattern = bool(re.search(r'\b\d{3}-\d{2}-\d{4}\b', text_lower)) or \
                             bool(re.search(r'\btax\s*id[:\s]*\d{3}-\d{2}-\d{4}', text_lower))
        
        # Check for USA indicators
        is_usa = any(ind in text_lower for ind in usa_direct)
        is_usa = is_usa or any(state in text_lower for state in us_state_names)
        is_usa = is_usa or any(abbrev in ' ' + text_lower + ' ' for abbrev in us_state_abbrevs)
        is_usa = is_usa or any(mil in text_lower for mil in us_military)
        is_usa = is_usa or has_us_tax_pattern
        
        # ════════════════════════════════════════════════════════════════════════
        # OTHER COUNTRY DETECTION
        # ════════════════════════════════════════════════════════════════════════
        india_indicators = ['india', 'inr', 'rupees', '₹', 'gstin', 
                           'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata']
        uk_indicators = ['uk', 'united kingdom', 'gbp', 'pound', 'london', 'england']
        eu_indicators = ['euro', '€', 'germany', 'france', 'spain', 'italy', 'netherlands']
        
        is_india = any(ind in text_lower for ind in india_indicators)
        is_uk = any(ind in text_lower for ind in uk_indicators)
        is_eu = any(ind in text_lower for ind in eu_indicators)
        
        # ════════════════════════════════════════════════════════════════════════
        # VAT DETECTION (Enhanced)
        # ════════════════════════════════════════════════════════════════════════
        has_vat = 'vat' in text_lower
        has_vat = has_vat or bool(re.search(r'vat\s*(number|no|#|id)?[:\s]*\w+', text_lower))
        
        # Check for GST (India/Australia, not used in USA/EU)
        has_gst = 'gst' in text_lower or 'gstin' in text_lower
        
        # Check for Sales Tax (USA)
        has_sales_tax = 'sales tax' in text_lower
        
        # ════════════════════════════════════════════════════════════════════════
        # VIOLATION CHECKS - ANY TRIGGERS FAKE
        # ════════════════════════════════════════════════════════════════════════
        
        # CRITICAL: VAT used in USA context
        if is_usa and has_vat:
            return {
                "type": "tax_geography_mismatch",
                "severity": "critical",
                "description": "VAT tax system used in USA context - VAT is NOT used in the United States. This is a HARD INVALIDITY."
            }
        
        # Violation: GST used outside India/Australia context
        if has_gst and (is_usa or is_uk):
            return {
                "type": "tax_geography_mismatch",
                "severity": "critical",
                "description": "GST tax system used in non-GST country (USA/UK do not use GST)"
            }
        
        # Violation: Sales Tax used in EU/UK context
        if (is_eu or is_uk) and has_sales_tax and not has_vat:
            return {
                "type": "tax_geography_mismatch",
                "severity": "critical",
                "description": "US Sales Tax referenced in EU/UK context - these regions use VAT"
            }
        
        return None
    
    def _check_banking_geography_mismatch(self, text_lower: str) -> Optional[Dict]:
        """
        Check if banking system matches geography.
        
        HARD INVALIDITY TRIGGERS:
        - IBAN used by US seller → FAKE
        - US Routing/Account used by EU seller → FAKE
        """
        
        # ════════════════════════════════════════════════════════════════════════
        # IBAN DETECTION (European/International banking)
        # ════════════════════════════════════════════════════════════════════════
        # Check for explicit IBAN label
        has_iban = bool(re.search(r'\biban\b', text_lower))
        # Check for IBAN pattern: 2 letters + 2 digits + alphanumeric (common format)
        has_iban = has_iban or bool(re.search(r'\b[a-z]{2}\d{2}[a-z0-9]{10,30}\b', text_lower))
        
        # ════════════════════════════════════════════════════════════════════════
        # COMPREHENSIVE USA DETECTION (same as tax check)
        # ════════════════════════════════════════════════════════════════════════
        us_state_abbrevs = [
            ' al ', ' ak ', ' az ', ' ar ', ' ca ', ' co ', ' ct ', ' de ', ' fl ', ' ga ',
            ' hi ', ' id ', ' il ', ' in ', ' ia ', ' ks ', ' ky ', ' la ', ' me ', ' md ',
            ' ma ', ' mi ', ' mn ', ' ms ', ' mo ', ' mt ', ' ne ', ' nv ', ' nh ', ' nj ',
            ' nm ', ' ny ', ' nc ', ' nd ', ' oh ', ' ok ', ' or ', ' pa ', ' ri ', ' sc ',
            ' sd ', ' tn ', ' tx ', ' ut ', ' vt ', ' va ', ' wa ', ' wv ', ' wi ', ' wy ',
            ' dc ', ',al ', ',ak ', ',az ', ',ar ', ',ca ', ',co ', ',ct ', ',de ', ',fl ',
            ',ga ', ',hi ', ',id ', ',il ', ',in ', ',ia ', ',ks ', ',ky ', ',la ', ',me ',
            ',md ', ',ma ', ',mi ', ',mn ', ',ms ', ',mo ', ',mt ', ',ne ', ',nv ', ',nh ',
            ',nj ', ',nm ', ',ny ', ',nc ', ',nd ', ',oh ', ',ok ', ',or ', ',pa ', ',ri ',
            ',sc ', ',sd ', ',tn ', ',tx ', ',ut ', ',vt ', ',va ', ',wa ', ',wv ', ',wi ',
            ',wy ', ',dc '
        ]
        
        us_state_names = [
            'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
            'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
            'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
            'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
            'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
            'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina',
            'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania',
            'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas',
            'utah', 'vermont', 'virginia', 'washington', 'west virginia',
            'wisconsin', 'wyoming', 'district of columbia'
        ]
        
        usa_direct = ['usa', 'united states', 'u.s.a', 'u.s.', 'usd', 'dollar', 'america']
        us_military = ['apo ', 'fpo ', 'dpo ', 'apo ap', 'apo ae', 'apo aa']
        
        # US Tax ID patterns
        has_us_tax_pattern = bool(re.search(r'\b\d{3}-\d{2}-\d{4}\b', text_lower)) or \
                             bool(re.search(r'\btax\s*id[:\s]*\d{3}-\d{2}-\d{4}', text_lower))
        
        is_usa = any(ind in text_lower for ind in usa_direct)
        is_usa = is_usa or any(state in text_lower for state in us_state_names)
        is_usa = is_usa or any(abbrev in ' ' + text_lower + ' ' for abbrev in us_state_abbrevs)
        is_usa = is_usa or any(mil in text_lower for mil in us_military)
        is_usa = is_usa or has_us_tax_pattern
        
        # ════════════════════════════════════════════════════════════════════════
        # VIOLATION CHECK - IBAN IN USA = HARD INVALIDITY
        # ════════════════════════════════════════════════════════════════════════
        if is_usa and has_iban:
            return {
                "type": "banking_geography_mismatch",
                "severity": "critical",
                "description": "IBAN banking format used by US-based seller - US banks use Routing/Account numbers, NOT IBAN. This is a HARD INVALIDITY."
            }
        
        return None
    
    def _check_date_chronology(self, text: str, extracted_fields: Dict = None) -> Optional[Dict]:
        """Check if due date is earlier than issue date (impossible)"""
        
        issue_date = None
        due_date = None
        
        # Try to extract from structured fields first
        if extracted_fields:
            issue_str = extracted_fields.get('invoice_date', extracted_fields.get('date', ''))
            due_str = extracted_fields.get('due_date', extracted_fields.get('payment_due', ''))
            
            issue_date = self._parse_date(issue_str)
            due_date = self._parse_date(due_str)
        
        # Fallback: Extract from text using regex
        if not issue_date or not due_date:
            # Look for labeled dates
            issue_match = re.search(r'(invoice\s+date|date\s+of\s+issue|issued?)\s*[:=]?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})', text, re.IGNORECASE)
            due_match = re.search(r'(due\s+date|payment\s+due|pay\s+by)\s*[:=]?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})', text, re.IGNORECASE)
            
            if issue_match:
                issue_date = self._parse_date(issue_match.group(2))
            if due_match:
                due_date = self._parse_date(due_match.group(2))
        
        # Check chronology
        if issue_date and due_date:
            if due_date < issue_date:
                return {
                    "type": "date_chronology_error",
                    "severity": "critical",
                    "description": f"Due date ({due_date.strftime('%Y-%m-%d')}) is earlier than invoice date ({issue_date.strftime('%Y-%m-%d')}) - logically impossible"
                }
        
        return None
    
    def _check_line_item_math(self, text: str, extracted_fields: Dict = None) -> List[Dict]:
        """
        Check if Quantity × Unit Price = Line Total for each line item.
        This is a CRITICAL check for invoice validity.
        """
        violations = []
        
        # Try to find line item patterns in text
        # Common patterns: "2 x $50.00 = $100.00" or "Widget | 2 | $50.00 | $100.00"
        
        # Pattern 1: Qty x Price = Total format
        pattern1 = re.findall(
            r'(\d+)\s*[x×*]\s*\$?([\d,]+\.?\d*)\s*=\s*\$?([\d,]+\.?\d*)',
            text, re.IGNORECASE
        )
        
        for match in pattern1:
            try:
                qty = float(match[0])
                unit_price = float(match[1].replace(',', ''))
                line_total = float(match[2].replace(',', ''))
                expected = qty * unit_price
                
                # Allow 1% tolerance for rounding
                if abs(expected - line_total) > max(0.01, line_total * 0.01):
                    violations.append({
                        "type": "line_item_math_error",
                        "severity": "critical",
                        "description": f"Line item calculation error: {int(qty)} × ${unit_price:.2f} = ${expected:.2f}, but invoice shows ${line_total:.2f}"
                    })
            except (ValueError, TypeError):
                continue
        
        # Pattern 2: Table-like format (look for sequences of numbers)
        lines = text.split('\n')
        for line in lines:
            # Find lines with 3+ numbers that might be Qty, Price, Total
            numbers = re.findall(r'\$?([\d,]+\.?\d*)', line)
            clean_nums = []
            for n in numbers:
                try:
                    val = float(n.replace(',', ''))
                    if val > 0:
                        clean_nums.append(val)
                except:
                    pass
            
            # Check if we have at least 3 numbers and they might form Qty × Price = Total
            if len(clean_nums) >= 3:
                for i in range(len(clean_nums) - 2):
                    a, b, c = clean_nums[i], clean_nums[i+1], clean_nums[i+2]
                    
                    # Check if a × b should equal c (within 1% tolerance)
                    if a > 0 and b > 0 and c > 0:
                        expected = a * b
                        # Only flag if it LOOKS like a line item (a is small integer qty, b and c are prices)
                        if a == int(a) and a <= 1000 and b >= 0.01 and c >= 0.01:
                            if abs(expected - c) > max(0.01, c * 0.01) and abs(expected - c) > 0.50:
                                # Additional check: is this close but wrong?
                                if 0.5 < expected / c < 2.0:  # Within 2x means likely intentional line item
                                    violations.append({
                                        "type": "line_item_math_error",
                                        "severity": "critical",
                                        "description": f"Calculation mismatch detected: {int(a)} × ${b:.2f} should be ${expected:.2f}, but shows ${c:.2f}"
                                    })
                                    break  # One violation per line is enough
        
        # Check structured fields if available
        if extracted_fields and 'line_items' in extracted_fields:
            for idx, item in enumerate(extracted_fields.get('line_items', [])):
                try:
                    qty = float(item.get('quantity', 0))
                    unit_price = float(str(item.get('unit_price', item.get('price', 0))).replace('$', '').replace(',', ''))
                    total = float(str(item.get('total', item.get('amount', 0))).replace('$', '').replace(',', ''))
                    
                    if qty > 0 and unit_price > 0 and total > 0:
                        expected = qty * unit_price
                        if abs(expected - total) > max(0.01, total * 0.01):
                            violations.append({
                                "type": "line_item_math_error",
                                "severity": "critical",
                                "description": f"Line item {idx+1}: {qty} × ${unit_price:.2f} = ${expected:.2f}, but shows ${total:.2f}"
                            })
                except (ValueError, TypeError, KeyError):
                    continue
        
        return violations
    
    def _check_total_math(self, text: str, extracted_fields: Dict = None) -> Optional[Dict]:
        """
        Check if Subtotal + Tax = Final Amount.
        This is a CRITICAL check for invoice validity.
        """
        subtotal = None
        tax = None
        total = None
        
        # Try structured fields first
        if extracted_fields:
            subtotal = self._extract_amount(extracted_fields.get('subtotal', extracted_fields.get('sub_total_price', '')))
            tax = self._extract_amount(extracted_fields.get('tax', extracted_fields.get('tax_price', extracted_fields.get('vat', ''))))
            total = self._extract_amount(extracted_fields.get('total', extracted_fields.get('total_price', extracted_fields.get('grand_total', ''))))
        
        # Fallback: Extract from text
        if subtotal is None:
            match = re.search(r'(subtotal|sub\s*-?\s*total)\s*[:=]?\s*\$?([\d,]+\.?\d*)', text, re.IGNORECASE)
            if match:
                subtotal = self._extract_amount(match.group(2))
        
        if tax is None:
            match = re.search(r'(tax|vat|gst)\s*[:=]?\s*\$?([\d,]+\.?\d*)', text, re.IGNORECASE)
            if match:
                tax = self._extract_amount(match.group(2))
        
        if total is None:
            match = re.search(r'(total|grand\s*total|amount\s*due|balance\s*due)\s*[:=]?\s*\$?([\d,]+\.?\d*)', text, re.IGNORECASE)
            if match:
                total = self._extract_amount(match.group(2))
        
        # Validate if we have all three values
        if subtotal is not None and tax is not None and total is not None:
            if subtotal > 0 and total > 0:
                expected_total = subtotal + tax
                difference = abs(expected_total - total)
                
                # Allow tolerance of $1.00 for rounding or 1% for larger amounts
                tolerance = max(1.0, total * 0.01)
                
                if difference > tolerance:
                    return {
                        "type": "total_math_error",
                        "severity": "critical",
                        "description": f"Total calculation error: Subtotal (${subtotal:.2f}) + Tax (${tax:.2f}) = ${expected_total:.2f}, but invoice shows ${total:.2f}"
                    }
        
        return None
    
    def _check_placeholder_content(self, text_lower: str) -> List[Dict]:
        """Check for placeholder or synthetic content"""
        violations = []
        
        # Placeholder domains/emails
        placeholder_patterns = [
            (r'example\.com', "Placeholder domain 'example.com' detected"),
            (r'example\.org', "Placeholder domain 'example.org' detected"),
            (r'test\.com', "Placeholder domain 'test.com' detected"),
            (r'sample@', "Placeholder email pattern 'sample@' detected"),
            (r'test@test', "Placeholder email 'test@test' detected"),
            (r'john\.?doe', "Placeholder name 'John Doe' detected"),
            (r'jane\.?doe', "Placeholder name 'Jane Doe' detected"),
            (r'lorem\s+ipsum', "Lorem Ipsum placeholder text detected"),
            (r'dolor\s+sit\s+amet', "Lorem Ipsum placeholder text detected"),
            (r'123\s*main\s*st', "Placeholder address '123 Main St' detected"),
            (r'acme\s*(corp|inc|company)', "Placeholder company 'ACME' detected"),
        ]
        
        for pattern, description in placeholder_patterns:
            if re.search(pattern, text_lower):
                violations.append({
                    "type": "placeholder_content",
                    "severity": "critical",
                    "description": description
                })
        
        return violations
    
    def _check_nonsensical_descriptions(self, text_lower: str) -> Optional[Dict]:
        """Check for AI-generated or nonsensical item descriptions"""
        
        # Common Faker/generator buzzwords (excessive use indicates fake)
        ai_buzzwords = [
            'synergies', 'paradigms', 'methodologies', 'e-business', 
            'synergize', 'leverage', 'disrupt', 'blockchain-enabled',
            'ai-powered', 'quantum', 'holistic', 'proactive',
            'best-of-breed', 'bleeding-edge', 'mission-critical',
            'next-generation', 'plug-and-play', 'value-added',
            'world-class', 'scalable solutions', 'seamless integration'
        ]
        
        buzzword_count = sum(1 for word in ai_buzzwords if word in text_lower)
        
        if buzzword_count >= 4:
            return {
                "type": "nonsensical_descriptions",
                "severity": "critical",
                "description": f"Item descriptions contain excessive business buzzwords ({buzzword_count} detected) - likely AI-generated content"
            }
        
        return None
    
    def _check_fabricated_identity(self, text_lower: str) -> Optional[Dict]:
        """Check for clearly fabricated seller/buyer identity"""
        
        fake_company_patterns = [
            r'abc\s*(company|corp|inc|llc)',
            r'xyz\s*(company|corp|inc|llc)',
            r'test\s*(vendor|company|corp)',
            r'sample\s*(inc|company|business)',
            r'fake\s*(company|business|vendor)',
            r'dummy\s*(corp|company|vendor)',
        ]
        
        for pattern in fake_company_patterns:
            if re.search(pattern, text_lower):
                return {
                    "type": "fabricated_identity",
                    "severity": "critical",
                    "description": "Generic/test company name detected - clearly fabricated seller identity"
                }
        
        return None
    
    def _step2_business_realism_check(self, text: str, text_lower: str,
                                       extracted_fields: Dict = None) -> Dict[str, Any]:
        """
        STEP 2: Evaluate business realism if document passed Step 1.
        Issues here lead to SUSPICIOUS (not FAKE).
        """
        issues = []
        
        # Check 1: Does seller look like a real business?
        if not self._has_business_identity(text_lower):
            issues.append({
                "type": "weak_business_identity",
                "severity": "medium",
                "description": "Missing business identification (no company name, address, or registration found)"
            })
        
        # Check 2: Are goods/services commercially realistic?
        unrealistic = self._check_unrealistic_items(text_lower)
        if unrealistic:
            issues.append(unrealistic)
        
        # Check 3: Do prices make real-world sense?
        price_issues = self._check_price_realism(text, extracted_fields)
        issues.extend(price_issues)
        
        # Check 4: Is tax applied logically?
        tax_issue = self._check_tax_logic(text, text_lower, extracted_fields)
        if tax_issue:
            issues.append(tax_issue)
        
        # Check 5: Invoice structure consistency
        structure_issue = self._check_invoice_structure(text, text_lower)
        if structure_issue:
            issues.append(structure_issue)
        
        # Check 6: Missing contact information
        if not self._has_contact_info(text_lower):
            issues.append({
                "type": "missing_contact",
                "severity": "low",
                "description": "No contact information (email/phone) found on invoice"
            })
        
        self.step2_issues = issues
        
        critical_issues = [i for i in issues if i.get('severity') == 'high']
        medium_issues = [i for i in issues if i.get('severity') in ['medium', 'low']]
        
        return {
            "issues": issues,
            "critical_issues": len(critical_issues),
            "minor_issues": len(medium_issues),
            "primary_issue": issues[0] if issues else None
        }
    
    def _has_business_identity(self, text_lower: str) -> bool:
        """Check if document has credible business identity"""
        has_company = bool(re.search(r'(inc|llc|ltd|corp|company|co\.|gmbh|pvt|private)', text_lower))
        has_address = bool(re.search(r'\d+\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|drive|lane)', text_lower))
        has_registration = bool(re.search(r'(gstin|vat\s*no|tax\s*id|ein|abn|registration)', text_lower))
        
        return has_company or has_address or has_registration
    
    def _check_unrealistic_items(self, text_lower: str) -> Optional[Dict]:
        """Check for unrealistic or impossible items"""
        
        # Items that don't belong on commercial invoices
        suspicious_items = [
            'illegal', 'drugs', 'weapons', 'counterfeit', 'stolen',
            'magic beans', 'unicorn', 'time travel', 'perpetual motion'
        ]
        
        for item in suspicious_items:
            if item in text_lower:
                return {
                    "type": "unrealistic_items",
                    "severity": "high",
                    "description": f"Unrealistic or suspicious item detected: '{item}'"
                }
        
        return None
    
    def _check_price_realism(self, text: str, extracted_fields: Dict = None) -> List[Dict]:
        """Check if prices make real-world sense"""
        issues = []
        
        # Extract all amounts
        amounts = re.findall(r'\$?([\d,]+\.?\d*)', text)
        parsed_amounts = []
        for amt in amounts:
            try:
                val = float(amt.replace(',', ''))
                if val > 0:
                    parsed_amounts.append(val)
            except:
                pass
        
        if not parsed_amounts:
            return issues
        
        # Check for impossibly high amounts (> $100M on single invoice)
        max_amount = max(parsed_amounts)
        if max_amount > 100_000_000:
            issues.append({
                "type": "unrealistic_amount",
                "severity": "medium",
                "description": f"Extremely high amount detected: ${max_amount:,.2f} - unusual for standard invoice"
            })
        
        # Check for items priced at $0.01 or less (suspicious)
        tiny_amounts = [a for a in parsed_amounts if 0 < a < 0.10]
        if len(tiny_amounts) > 2:
            issues.append({
                "type": "suspicious_pricing",
                "severity": "low",
                "description": f"Multiple items priced under $0.10 - unusual pricing pattern"
            })
        
        return issues
    
    def _check_tax_logic(self, text: str, text_lower: str, 
                         extracted_fields: Dict = None) -> Optional[Dict]:
        """Check if tax is applied logically"""
        
        # Extract subtotal and tax
        subtotal = None
        tax = None
        
        subtotal_match = re.search(r'subtotal\s*[:=]?\s*\$?([\d,]+\.?\d*)', text_lower)
        tax_match = re.search(r'(tax|vat|gst)\s*[:=]?\s*\$?([\d,]+\.?\d*)', text_lower)
        
        if subtotal_match and tax_match:
            try:
                subtotal = float(subtotal_match.group(1).replace(',', ''))
                tax = float(tax_match.group(2).replace(',', ''))
                
                if subtotal > 0 and tax > 0:
                    tax_rate = (tax / subtotal) * 100
                    
                    # Tax rates typically range from 0% to 30%
                    if tax_rate > 50:
                        return {
                            "type": "unrealistic_tax_rate",
                            "severity": "medium",
                            "description": f"Tax rate of {tax_rate:.1f}% is unrealistically high"
                        }
                    elif tax_rate > 30:
                        return {
                            "type": "high_tax_rate",
                            "severity": "low",
                            "description": f"Tax rate of {tax_rate:.1f}% is unusually high for most jurisdictions"
                        }
            except (ValueError, ZeroDivisionError):
                pass
        
        return None
    
    def _check_invoice_structure(self, text: str, text_lower: str) -> Optional[Dict]:
        """Check if invoice has proper structure"""
        
        # Required elements for a proper invoice
        has_invoice_number = bool(re.search(r'invoice\s*(#|no|number)\s*[:=]?\s*\w+', text_lower))
        has_date = bool(re.search(r'\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}', text))
        has_amounts = bool(re.search(r'\$?\d+\.\d{2}', text))
        has_total = bool(re.search(r'total\s*[:=]?\s*\$?[\d,]+\.?\d*', text_lower))
        
        missing = []
        if not has_invoice_number:
            missing.append("invoice number")
        if not has_date:
            missing.append("date")
        if not has_total:
            missing.append("total")
        
        if len(missing) >= 2:
            return {
                "type": "incomplete_structure",
                "severity": "medium",
                "description": f"Invoice missing standard elements: {', '.join(missing)}"
            }
        
        return None
    
    def _has_contact_info(self, text_lower: str) -> bool:
        """Check for contact information"""
        has_email = bool(re.search(r'[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}', text_lower))
        has_phone = bool(re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text_lower))
        has_website = bool(re.search(r'www\.[a-z0-9.-]+\.[a-z]{2,}', text_lower))
        
        return has_email or has_phone or has_website
    
    def _step3_supporting_signals(self, text: str, text_lower: str) -> Dict[str, Any]:
        """
        STEP 3: Gather supporting signals.
        These NEVER cause FAKE verdict on their own.
        """
        signals = []
        
        # Signal 1: Benford's Law deviation
        benford_result = check_benfords_law(text)
        if benford_result.get('is_suspicious'):
            signals.append({
                "type": "benfords_law_deviation",
                "severity": "supporting",
                "description": f"Number distribution deviates from Benford's Law (deviation: {benford_result.get('deviation', 'N/A')})"
            })
        
        # Signal 2: Overly round numbers
        round_count = self._count_round_numbers(text)
        if round_count >= 3:
            signals.append({
                "type": "round_numbers",
                "severity": "supporting",
                "description": f"Multiple suspiciously round numbers detected ({round_count} instances)"
            })
        
        # Signal 3: Repetitive wording
        if self._has_repetitive_wording(text):
            signals.append({
                "type": "repetitive_wording",
                "severity": "supporting",
                "description": "Document contains highly repetitive text patterns"
            })
        
        self.step3_signals = signals
        
        return {
            "signals": signals,
            "anomaly_count": len(signals)
        }
    
    def _count_round_numbers(self, text: str) -> int:
        """Count suspiciously round numbers"""
        amounts = re.findall(r'\$?([\d,]+)\.00\b', text)
        count = 0
        for amt in amounts:
            try:
                val = float(amt.replace(',', ''))
                if val >= 100 and val % 100 == 0:
                    count += 1
            except:
                pass
        return count
    
    def _has_repetitive_wording(self, text: str) -> bool:
        """Check for highly repetitive text"""
        words = text.lower().split()
        if len(words) < 20:
            return False
        unique_ratio = len(set(words)) / len(words)
        return unique_ratio < 0.3
    
    def _determine_final_verdict(self, step1: Dict, step2: Dict, 
                                  step3: Dict, step0: Dict = None) -> Dict[str, Any]:
        """
        Determine final verdict based on all steps.
        
        PRIORITY OVERRIDE (Step 0):
        When step0["override_active"] is True:
        - Force verdict = REAL
        - Force confidence = HIGH  
        - Suppress all SUSPICIOUS/MEDIUM from Step 2/3 heuristics
        - This is MANDATORY for verified retail invoices
        """
        
        # Build evidence list
        all_evidence = []
        all_evidence.extend([v['description'] for v in step1.get('violations', [])])
        all_evidence.extend([i['description'] for i in step2.get('issues', [])])
        all_evidence.extend([s['description'] for s in step3.get('signals', [])])
        
        # ════════════════════════════════════════════════════════════════════════
        # STEP 0 — PRIORITY OVERRIDE CHECK (MANDATORY)
        # ════════════════════════════════════════════════════════════════════════
        # If override is active, force REAL verdict regardless of Step 2/3
        if step0 and step0.get("override_active", False):
            return self._build_result(
                verdict="REAL",
                confidence="HIGH",
                primary_reason="Priority Override: Verified invoice with valid seller, correct tax system, and accurate calculations",
                evidence=step0.get("checks_passed", []) + ["Step 2/3 heuristics suppressed by override"],
                step1=step1, step2=step2, step3=step3,
                step0=step0
            )
        
        # Decision logic (only when override NOT active)
        if step1["is_fake"]:
            # Already handled by immediate return in analyze()
            pass
        
        critical_realism_issues = step2.get("critical_issues", 0)
        minor_realism_issues = step2.get("minor_issues", 0)
        supporting_anomalies = step3.get("anomaly_count", 0)
        
        # SUSPICIOUS: Critical realism issues
        if critical_realism_issues > 0:
            return self._build_result(
                verdict="SUSPICIOUS",
                confidence="MEDIUM",
                primary_reason=step2["primary_issue"]["description"],
                evidence=all_evidence,
                step1=step1, step2=step2, step3=step3,
                step0=step0
            )
        
        # SUSPICIOUS: Multiple minor issues + supporting anomalies
        if minor_realism_issues >= 2 and supporting_anomalies >= 1:
            return self._build_result(
                verdict="SUSPICIOUS",
                confidence="MEDIUM",
                primary_reason="Multiple minor issues combined with statistical anomalies",
                evidence=all_evidence,
                step1=step1, step2=step2, step3=step3,
                step0=step0
            )
        
        # SUSPICIOUS: Several minor issues alone
        if minor_realism_issues >= 3:
            return self._build_result(
                verdict="SUSPICIOUS",
                confidence="LOW",
                primary_reason=step2["primary_issue"]["description"],
                evidence=all_evidence,
                step1=step1, step2=step2, step3=step3,
                step0=step0
            )
        
        # REAL: No significant issues
        confidence = "HIGH" if supporting_anomalies == 0 and minor_realism_issues == 0 else "MEDIUM"
        if minor_realism_issues > 0:
            confidence = "MEDIUM"
        if supporting_anomalies > 0:
            confidence = "LOW" if confidence == "MEDIUM" else "MEDIUM"
        
        return self._build_result(
            verdict="REAL",
            confidence=confidence,
            primary_reason="Document passes all validation checks",
            evidence=["No critical issues detected"] + all_evidence if all_evidence else ["Document appears legitimate"],
            step1=step1, step2=step2, step3=step3,
            step0=step0
        )
    
    def _build_fake_result(self, step1: Dict) -> Dict[str, Any]:
        """
        ════════════════════════════════════════════════════════════════════════
        Build result for FAKE verdict - THIS IS FINAL AND LOCKED
        ════════════════════════════════════════════════════════════════════════
        
        This result CANNOT be modified by:
        - Image manipulation scores  
        - Risk scores
        - Benford's Law signals
        - Round number patterns
        - Any Step 2 or Step 3 findings
        
        LOW RISK or CLEAN verdict is FORBIDDEN once this function is called.
        ════════════════════════════════════════════════════════════════════════
        """
        primary_violation = step1["primary_violation"]
        
        return {
            # ═══════════════════════════════════════════════════════════════════
            # LOCKED VERDICT - CANNOT BE DOWNGRADED
            # ═══════════════════════════════════════════════════════════════════
            "verdict": "FAKE",
            "confidence": "HIGH",
            "verdict_locked": True,  # Signal that this CANNOT be changed
            "primary_reason": primary_violation["description"],
            "supporting_evidence": [v["description"] for v in step1["violations"]],
            "analysis_steps": {
                "step1_hard_invalidity": {
                    "passed": False,
                    "violations": step1["violations"],
                    "verdict_triggered": True  # Explicit flag
                },
                "step2_business_realism": {"skipped": True, "reason": "FAKE determined in Step 1 - further analysis prohibited"},
                "step3_supporting_signals": {"skipped": True, "reason": "FAKE determined in Step 1 - supporting signals ignored"}
            },
            # Legacy compatibility fields
            "fraud_indicators": step1["violations"],
            "risk_score": 1.0,
            "total_flags": len(step1["violations"]),
            "severity": "Critical"
        }
    
    def _build_result(self, verdict: str, confidence: str, primary_reason: str,
                      evidence: List[str], step1: Dict, step2: Dict, step3: Dict,
                      step0: Dict = None) -> Dict[str, Any]:
        """Build complete analysis result with Step 0 priority override info"""
        
        # Calculate legacy risk score for backward compatibility
        if verdict == "FAKE":
            risk_score = 1.0
        elif verdict == "SUSPICIOUS":
            risk_score = 0.6 if confidence == "MEDIUM" else 0.4
        else:
            # REAL with priority override gets lowest risk score
            if step0 and step0.get("override_active"):
                risk_score = 0.05  # Very clean
            else:
                risk_score = 0.1 if confidence == "HIGH" else 0.2
        
        all_indicators = step1.get("violations", []) + step2.get("issues", []) + step3.get("signals", [])
        
        # Determine severity - Priority override forces CLEAN
        if step0 and step0.get("override_active"):
            severity = "Clean"
        elif verdict == "FAKE":
            severity = "High"
        elif verdict == "SUSPICIOUS":
            severity = "Medium"
        else:
            severity = "Low"
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "primary_reason": primary_reason,
            "supporting_evidence": evidence[:10],  # Limit to top 10
            "priority_override_active": step0.get("override_active", False) if step0 else False,
            "analysis_steps": {
                "step0_priority_override": {
                    "override_active": step0.get("override_active", False) if step0 else False,
                    "checks_passed": step0.get("checks_passed", []) if step0 else [],
                    "checks_failed": step0.get("checks_failed", []) if step0 else [],
                    "reason": step0.get("reason", "Not evaluated") if step0 else "Not evaluated"
                },
                "step1_hard_invalidity": {
                    "passed": not step1["is_fake"],
                    "violations": step1["violations"]
                },
                "step2_business_realism": {
                    "critical_issues": step2.get("critical_issues", 0),
                    "minor_issues": step2.get("minor_issues", 0),
                    "issues": step2.get("issues", []),
                    "suppressed_by_override": step0.get("override_active", False) if step0 else False
                },
                "step3_supporting_signals": {
                    "anomaly_count": step3.get("anomaly_count", 0),
                    "signals": step3.get("signals", []),
                    "suppressed_by_override": step0.get("override_active", False) if step0 else False
                }
            },
            # Legacy compatibility fields
            "fraud_indicators": all_indicators,
            "risk_score": risk_score,
            "total_flags": len(all_indicators),
            "severity": severity
        }
    
    # Helper methods
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        if not date_str:
            return None
        
        date_str = str(date_str).strip()
        date_str = date_str.replace('.', '/').replace('-', '/')
        
        formats = [
            "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%Y",
            "%d/%m/%y", "%Y/%m/%d", "%m/%d/%y",
            "%d %b %Y", "%d %B %Y", "%b %d, %Y"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None
    
    def _extract_amount(self, value) -> Optional[float]:
        """Extract numeric amount from various formats"""
        if value is None:
            return None
        
        try:
            clean = str(value).replace('$', '').replace('£', '').replace('€', '')
            clean = clean.replace('₹', '').replace(',', '').strip()
            return float(clean) if clean else None
        except (ValueError, TypeError):
            return None


def analyze_document_auditor(ocr_data: Dict[str, str], 
                              extracted_fields: Dict = None) -> Dict[str, Any]:
    """
    Convenience function for auditor-style fraud analysis.
    
    Args:
        ocr_data: OCR extracted text
        extracted_fields: Optional structured document fields
        
    Returns:
        Complete fraud analysis with verdict
    """
    detector = AuditorFraudDetector()
    return detector.analyze(ocr_data, extracted_fields)
