# Test script for Step 0 Priority Override
from app.auditor_fraud_detector import AuditorFraudDetector

def test_valid_indian_invoice():
    """Test that a valid Indian invoice with GST gets REAL verdict with override"""
    d = AuditorFraudDetector()
    r = d.analyze({
        'easyocr_text': '''ABC Store Pvt Ltd
        123 MG Road, Mumbai, Maharashtra 400001, India
        Phone: +91 9876543210
        Email: sales@abcstore.in
        GSTIN: 27AABCU9603R1ZM
        
        Invoice #INV-2026-0001
        Date: 15/01/2026
        
        Product: Widget Pro
        Qty: 2 x Rs 500.00 = Rs 1000.00
        
        Subtotal: Rs 1000.00
        GST 18%: Rs 180.00
        Grand Total: Rs 1180.00
        ''',
        'tesseract_text': ''
    })
    
    print("=" * 60)
    print("TEST 1: Valid Indian Invoice with GST")
    print("=" * 60)
    print(f"Verdict: {r['verdict']}")
    print(f"Override Active: {r.get('priority_override_active', False)}")
    print(f"Severity: {r['severity']}")
    print(f"Risk Score: {r['risk_score']}")
    print(f"Reason: {r['primary_reason']}")
    print(f"Step 0 Checks Passed: {r['analysis_steps']['step0_priority_override']['checks_passed']}")
    print()
    
    # Verify expected results
    assert r['verdict'] == 'REAL', f"Expected REAL, got {r['verdict']}"
    assert r.get('priority_override_active') == True, "Expected override to be active"
    assert r['severity'] == 'Clean', f"Expected Clean, got {r['severity']}"
    print("✓ TEST 1 PASSED")
    print()

def test_fake_vat_in_usa():
    """Test that VAT in USA context still triggers FAKE"""
    d = AuditorFraudDetector()
    r = d.analyze({
        'easyocr_text': '''ABC Corp
        123 Main Street, New York, NY 10001, USA
        Phone: +1 555-123-4567
        
        Invoice #001
        Date: 15/01/2026
        
        Product: Widget
        Subtotal: $100.00
        VAT 20%: $20.00
        Total: $120.00
        ''',
        'tesseract_text': ''
    })
    
    print("=" * 60)
    print("TEST 2: Invalid Invoice - VAT in USA (should be FAKE)")
    print("=" * 60)
    print(f"Verdict: {r['verdict']}")
    print(f"Override Active: {r.get('priority_override_active', False)}")
    print(f"Severity: {r['severity']}")
    print(f"Reason: {r['primary_reason']}")
    print()
    
    assert r['verdict'] == 'FAKE', f"Expected FAKE, got {r['verdict']}"
    print("✓ TEST 2 PASSED")
    print()

def test_template_invoice_gets_override():
    """Test that a templated-looking valid invoice still gets REAL"""
    d = AuditorFraudDetector()
    r = d.analyze({
        'easyocr_text': '''XYZ Solutions Ltd
        Business Center, Delhi, India
        GSTIN: 07AABCX1234Z1ZP
        Contact: info@xyz.in
        
        INVOICE
        Invoice Number: 1001
        Date: 17/01/2026
        
        Services Rendered
        Qty: 1 x Rs 5000.00 = Rs 5000.00
        
        Subtotal: Rs 5000.00
        GST: Rs 900.00
        Total: Rs 5900.00
        ''',
        'tesseract_text': ''
    })
    
    print("=" * 60)
    print("TEST 3: Templated Invoice (should get REAL with override)")
    print("=" * 60)
    print(f"Verdict: {r['verdict']}")
    print(f"Override Active: {r.get('priority_override_active', False)}")
    print(f"Severity: {r['severity']}")
    print(f"Reason: {r['primary_reason']}")
    print()
    
    assert r['verdict'] == 'REAL', f"Expected REAL, got {r['verdict']}"
    print("✓ TEST 3 PASSED")
    print()

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("TESTING STEP 0 PRIORITY OVERRIDE")
    print("=" * 60 + "\n")
    
    test_valid_indian_invoice()
    test_fake_vat_in_usa()
    test_template_invoice_gets_override()
    
    print("=" * 60)
    print("ALL TESTS PASSED!")
    print("=" * 60)
