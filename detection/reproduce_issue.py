import sys
import os

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.invoice_fraud_detector import analyze_invoice_fraud

def run_test():
    print("Running Fraud Detection Logic Test...")
    
    # 1. Test Clean Invoice
    print("\n--- Test 1: Clean Invoice ---")
    clean_text = """
    Invoice #12345
    Date: 12/05/2023
    Vendor: Acu Tech Solutions
    Contact: support@acutech.com
    
    Item 1: Service A  $100.00
    Item 2: Service B  $200.00
    Total: $300.00
    """
    clean_ocr = {'easyocr_text': clean_text, 'tesseract_text': clean_text}
    result_clean = analyze_invoice_fraud(clean_ocr)
    print(f"Risk Score: {result_clean['risk_score']}")
    print(f"Indicators: {result_clean['fraud_indicators']}")
    
    # 2. Test Fraud Invoice (Real case from screenshot)
    print("\n--- Test 2: Fraud Invoice (Faker Content) ---")
    fraud_text = """
    Oneal, Rodriguez and Young
    74116 Bradley Valleys
    New Charles, UT 99191
    VAT Number u006640633258
    
    Evans-Roy
    Alexander Jones
    PSC 0169, Box 8396
    APO AA 97531
    Nicaragua
    
    Item Description Unit Cost Quantity Line total
    10 monetize next-generation schemes 64.18 4.51 766.81
    1 leverage one-to-one markets 45.43 9.6 150.75
    4 cultivate plug-and-play vortals 14.26 4.96 202.91
    
    Subtotal 143.15
    Discount -5.03% 20.06
    Total 1695.89
    
    Please pay your invoice within 30 days of receiving it.
    Terms
    These are our terms and conditions.
    Notes
    Thank you for being our customer
    """
    fraud_ocr = {'easyocr_text': fraud_text, 'tesseract_text': fraud_text}
    result_fraud = analyze_invoice_fraud(fraud_ocr)
    print(f"Risk Score: {result_fraud['risk_score']}")
    print(f"Indicators: {[i['type'] for i in result_fraud['fraud_indicators']]}")

if __name__ == "__main__":
    run_test()
