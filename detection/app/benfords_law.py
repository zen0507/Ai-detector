import re
import math
from typing import Dict, List, Any
from collections import Counter

def check_benfords_law(text: str) -> Dict[str, Any]:
    """
    Analyzes the text for conformity to Benford's Law (First Digit Law).
    Benford's Law states that in many naturally occurring collections of numbers, 
    the leading significant digit is likely to be small.
    1 appears ~30% of the time, 9 appears ~4.6% of the time.
    
    Args:
        text (str): The extracted text from the document.
        
    Returns:
        Dict: Analysis result containing conformity score and details.
    """
    # Benford's expected distribution for digits 1-9
    BENFORD_PROBS = {
        1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097, 
        5: 0.079, 6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
    }
    
    # Extract all numbers from the text
    # We ignore dates, phone numbers, and IDs if possible, but for raw text 
    # we'll grab all numbers and filter for monetary-like values significantly.
    # Pattern: finds numbers, ignores leading zeros
    numbers = re.findall(r'\b[1-9][0-9]*[.,]?[0-9]*\b', text)
    
    # Filter: Keep only "significant" numbers (e.g. prices, quantities > 10)
    # We want to avoid single digits like "Page 1" or small quantities being the only data
    # But Benford's law applies to all scales. Let's stick to extraction of leading digits.
    
    leading_digits = []
    for num_str in numbers:
        # cleanup
        clean_num = ''.join(c for c in num_str if c.isdigit())
        if clean_num and clean_num[0] != '0':
            leading_digits.append(int(clean_num[0]))
            
    total_count = len(leading_digits)
    
    # Benford's law requires a decent sample size to be statistically valid.
    # If we have too few numbers, the test is unreliable.
    if total_count < 5:
        return {
            "is_suspicious": False,
            "score": 0.0,
            "reason": "Insufficient data for statistical analysis"
        }
        
    # Calculate observed frequencies
    counts = Counter(leading_digits)
    observed_probs = {d: counts.get(d, 0) / total_count for d in range(1, 10)}
    
    # Calculate divergence (Chi-Square-ish or Mean Absolute Deviation)
    # We'll use Mean Absolute Deviation (MAD) for simplicity and robustness
    total_deviation = 0.0
    for d in range(1, 10):
        expected = BENFORD_PROBS[d]
        observed = observed_probs[d]
        total_deviation += abs(observed - expected)
        
    # MAD ranges roughly from 0.0 (Perfect) to ~1.4 (Worst case)
    # Thresholds for Benford analysis typically:
    # < 0.006: Close conformity
    # 0.006 - 0.012: Acceptable
    # 0.012 - 0.015: Marginally acceptable
    # > 0.015: Nonconformity
    
    # NOTE: Financial documents often have specific price points (e.g. $9.99) preventing perfect fit.
    # We use looser thresholds for this specific use case.
    
    # Our normalized risk score (0 to 1)
    # A deviation sum > 0.15 is considered very suspicious for general datasets
    
    risk_score = 0.0
    is_suspicious = False
    
    if total_deviation > 0.25: # High deviation
        risk_score = 0.8
        is_suspicious = True
    elif total_deviation > 0.15: # Moderate deviation
        risk_score = 0.4
        is_suspicious = False
        
    return {
        "is_suspicious": is_suspicious,
        "score": risk_score,
        "deviation": round(total_deviation, 3),
        "reason": f"Digit distribution deviation: {round(total_deviation, 3)} (High > 0.25)" if is_suspicious else "Normal distribution"
    }
