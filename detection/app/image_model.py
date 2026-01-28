import os
from PIL import Image, ImageChops, ImageEnhance, ImageStat


def image_risk(image_path: str) -> float:
    """
    Analyzes an image for digital manipulation using Error Level Analysis (ELA).
    ELA detects differences in compression levels. Edited areas often have 
    different compression artifacts than the rest of the image.
    
    Args:
        image_path (str): Path to the image file.
        
    Returns:
        float: Risk score between 0.0 (Low risk) and 1.0 (High risk).
    """
    try:
        # 1. Open original image
        original = Image.open(image_path).convert("RGB")
        
        # 2. Resave image at a known quality (90%) to a temporary buffer/file
        # We need to simulate the re-compression
        temp_filename = "temp_ela_check.jpg"
        original.save(temp_filename, "JPEG", quality=90)
        resaved = Image.open(temp_filename).convert("RGB")
        
        # 3. Calculate Error Level Analysis (Difference)
        ela_image = ImageChops.difference(original, resaved)
        
        # 4. Analyze the difference (Noise)
        extrema = ela_image.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        # If image is very clean (max_diff is low), it might be a pristine original or heavily compressed.
        if max_diff == 0:
            os.remove(temp_filename)
            return 0.1 # Very low risk
            
        # Scale to make it visible (Enhanced ELA) - similar to forensic tools
        scale = 255.0 / max_diff
        ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
        
        # 5. Calculate Statistics of the ELA noise
        stat = ImageStat.Stat(ela_image)
        # Mean brightness of the ELA noise map
        avg_brightness = sum(stat.mean) / len(stat.mean)
        
        # Clean up
        resaved.close()
        original.close()
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        # 6. Scoring Logic
        # In a natural JPEG, ELA noise should be relatively uniform and low-ish after re-save.
        # High average brightness in ELA indicates a lot of pixels changed significantly,
        # which can happen if different parts were saved at different qualities (copy-paste).
        # Note: This is a simplified heuristic. 
        # Clean JPEGs usually have low ELA response when resaved at high quality.
        # Manipulated images often have higher 'error' in manipulated regions.
        
        # Heuristic: 
        # < 10: Low noise (Consistent)
        # 10 - 30: Moderate noise
        # > 30: High noise (Suspicious)
        
        normalized_score = min(avg_brightness / 40.0, 1.0)
        
        # Boost score if specific channels variance is high (optional, skipping for speed)
        
        return round(normalized_score, 3)

    except Exception as e:
        print(f"ELA forensics error: {str(e)}")
        # Clean up if failed
        if os.path.exists("temp_ela_check.jpg"):
            try:
                os.remove("temp_ela_check.jpg")
            except:
                pass
        return 0.5  # Default medium risk
