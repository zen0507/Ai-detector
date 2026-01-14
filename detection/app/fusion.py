def final_score(tabular, image, doc):
    score = (0.5 * tabular) + (0.3 * image) + (0.2 * doc)

    if score > 0.8:
        risk = "High Risk"
    elif score > 0.5:
        risk = "Medium Risk"
    else:
        risk = "Low Risk"

    return {
        "final_score": round(score, 3),
        "risk_level": risk
    }
