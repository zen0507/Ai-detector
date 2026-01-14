"""
Risk Reduction Recommendation Engine
Generates specific, actionable advice to mitigate risks identified during document analysis.
"""

from typing import List, Dict, Any

def get_risk_reduction_recommendations(analysis_result: Dict[str, Any], image_score: float) -> List[Dict[str, str]]:
    """
    Generate targeted risk reduction recommendations based on specific fraud indicators.
    
    Args:
        analysis_result: Dictionary containing 'fraud_indicators' list from the detector
        image_score: Float representing image manipulation probability
        
    Returns:
        List of recommendation dictionaries with 'title' and 'desc'
    """
    recommendations = []
    indicators = analysis_result.get('fraud_indicators', [])
    
    # 1. Map specific fraud indicators to actionable advice
    for ind in indicators:
        kind = ind.get('type')
        val = ind.get('value', '')
        field = ind.get('field', 'field')
        
        if kind == 'missing_field':
            recommendations.append({
                "title": f"Missing Valid {field.title()}",
                "desc": f"The document lacks a standard {field}. Request a corrected invoice explicitly stating this information."
            })
            
        elif kind == 'suspicious_amount':
            recommendations.append({
                "title": "Verify Round Numbers",
                "desc": f"The amount ${val:,.2f} is suspiciously round. Confirm if this is an estimate and request a final invoice with exact calculations."
            })
            
        elif kind == 'threshold_gaming':
            recommendations.append({
                "title": "Enforce Approval Protocol",
                "desc": f"Amount is just below the approval threshold. Require secondary management review for this specific transaction."
            })
            
        elif kind == 'future_date':
            recommendations.append({
                "title": "Hold Payment",
                "desc": "Document is dated in the future. Do not process payment until the date has passed and goods/services are received."
            })
            
        elif kind == 'weekend_date':
            recommendations.append({
                "title": "Verify Vendor Hours",
                "desc": "Invoice issued on a weekend. specific verification of the vendor's operating days is recommended."
            })
            
        elif kind == 'poor_formatting':
            recommendations.append({
                "title": "Request Standardization",
                "desc": "Document formatting suggests a manual creation. Ask the vendor to submit a standard export from their accounting system."
            })
            
        elif kind == 'suspicious_vendor':
            recommendations.append({
                "title": "Vendor Validation",
                "desc": "The vendor name appears generic or test-related. Cross-reference with your approved vendor master list immediately."
            })
            
        elif kind == 'missing_contact':
            recommendations.append({
                "title": "Establish Contact",
                "desc": "No email or phone number found. Call the vendor using a known file number to verify they issued this invoice."
            })
            
        elif kind == 'math_inconsistency':
            recommendations.append({
                "title": "Manual Recalculation",
                "desc": "Line items do not sum to the total. Perform a line-by-line manual addition before approving."
            })
            
        elif kind == 'urgency_pressure':
            recommendations.append({
                "desc": "Artificial urgency detected. This is a common social engineering tactic. Pause and verify details calmly."
            })

        elif kind == 'repetitive_content':
            recommendations.append({
                "title": "Suspected Template Fraud",
                "desc": "High text duplication detected. The invoice may be a modified template. Verify line item specifics with the requestor."
            })

    # 2. Check for Image Manipulation Risks
    if image_score > 0.4:
        recommendations.append({
            "title": "Require Original Digital File",
            "desc": "High probability of image editing software usage. Reject this file and demand the original PDF export, not a screenshot or scan."
        })
        
    # 3. Check for Non-Financial content (if indicators are empty but score is low/weird)
    # This might have been handled by the "unknown" type detector, but we add a fallback here.
    if not recommendations and image_score < 0.2 and not indicators:
         # If it's safe, we don't need recommendations, but the user asked for "how to decrease risk"
         # If the risk is already low, we can offer general "Hygiene" advice.
         pass

    # Deduplicate recommendations based on title
    seen_titles = set()
    unique_recs = []
    for rec in recommendations:
        if rec['title'] not in seen_titles:
            seen_titles.add(rec['title'])
            unique_recs.append(rec)
            
    return unique_recs
