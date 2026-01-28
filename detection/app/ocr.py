import easyocr
import pytesseract
from PIL import Image
from pathlib import Path

# EasyOCR reader (DL-based OCR)
reader = easyocr.Reader(['en'])

def extract_text(image_path):
    """
    Extract text from an image or PDF file.
    
    Supports:
    - Images: PNG, JPG, JPEG, TIFF, BMP, GIF
    - Documents: PDF (converted to images first)
    """
    file_path = Path(image_path)
    file_ext = file_path.suffix.lower()
    
    # ════════════════════════════════════════════════════════════════════════
    # PDF HANDLING - Convert to images first
    # ════════════════════════════════════════════════════════════════════════
    if file_ext == '.pdf':
        return _extract_text_from_pdf(image_path)
    
    # ════════════════════════════════════════════════════════════════════════
    # IMAGE HANDLING - Direct OCR
    # ════════════════════════════════════════════════════════════════════════
    return _extract_text_from_image(image_path)


def _extract_text_from_pdf(pdf_path):
    """Extract text from PDF by converting pages to images first."""
    try:
        # Try to import pdf2image
        from pdf2image import convert_from_path
        
        # Convert PDF pages to images
        print(f"Converting PDF to images: {pdf_path}")
        images = convert_from_path(pdf_path, dpi=200, first_page=1, last_page=5)  # Limit to 5 pages
        
        all_text_tesseract = []
        all_text_easyocr = []
        
        for i, page_image in enumerate(images):
            print(f"Processing PDF page {i + 1}...")
            
            # Run OCR on each page
            page_result = _extract_text_from_pil_image(page_image)
            all_text_tesseract.append(page_result.get('tesseract_text', ''))
            all_text_easyocr.append(page_result.get('easyocr_text', ''))
        
        return {
            "easyocr_text": "\n\n".join(all_text_easyocr),
            "tesseract_text": "\n\n".join(all_text_tesseract)
        }
        
    except ImportError:
        print("ERROR: pdf2image not installed. Install with: pip install pdf2image")
        print("Also install poppler: https://github.com/osber/poppler-windows/releases")
        return {
            "easyocr_text": "[PDF processing unavailable - pdf2image not installed]",
            "tesseract_text": "[PDF processing unavailable - pdf2image not installed]"
        }
    except Exception as e:
        print(f"PDF processing error: {str(e)}")
        return {
            "easyocr_text": f"[PDF processing error: {str(e)}]",
            "tesseract_text": f"[PDF processing error: {str(e)}]"
        }


def _extract_text_from_image(image_path):
    """Extract text from an image file."""
    try:
        img = Image.open(image_path)
        return _extract_text_from_pil_image(img)
    except Exception as e:
        print(f"Image loading error: {str(e)}")
        return {
            "easyocr_text": f"[Image loading error: {str(e)}]",
            "tesseract_text": f"[Image loading error: {str(e)}]"
        }


def _extract_text_from_pil_image(img):
    """Extract text from a PIL Image object."""
    from PIL import ImageEnhance
    
    # Tesseract (Primary - Faster on CPU)
    text_tesseract = ""
    try:
        # Preprocessing for better accuracy
        # 1. Convert to grayscale
        img_gray = img.convert('L') 
        # 2. Increase contrast
        enhancer = ImageEnhance.Contrast(img_gray)
        img_enhanced = enhancer.enhance(1.8)
        
        text_tesseract = pytesseract.image_to_string(img_enhanced)
    except Exception as e:
        print(f"Tesseract OCR error: {str(e)}")
        text_tesseract = ""

    # EasyOCR (Secondary - Backup)
    # Check quality of Tesseract output
    clean_tess = "".join(c for c in text_tesseract if c.isalnum())
    total_tess = len(text_tesseract.strip())
    
    # Calculate alphanumeric density
    density = len(clean_tess) / total_tess if total_tess > 0 else 0
    
    # Run EasyOCR if Tesseract failed significantly or produced garbage
    text_easyocr = ""
    run_easyocr = False
    
    if total_tess < 20: 
        run_easyocr = True
    elif density < 0.4:  # Mostly symbols/garbage
        run_easyocr = True
        print(f"Tesseract produced low quality text (Density: {density:.2f}). Fallback to EasyOCR.")
        
    if run_easyocr:
        try:
            print("Running EasyOCR fallback...")
            # Convert PIL image to compatible format for EasyOCR
            import numpy as np
            img_array = np.array(img.convert('RGB'))
            result = reader.readtext(img_array)
            text_easyocr = " ".join([r[1] for r in result])
        except Exception as e:
            print(f"EasyOCR error: {str(e)}")
    else:
        text_easyocr = text_tesseract  # Use Tesseract text if it worked

    return {
        "easyocr_text": text_easyocr,
        "tesseract_text": text_tesseract
    }
