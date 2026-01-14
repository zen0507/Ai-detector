import easyocr
import pytesseract
from PIL import Image

# EasyOCR reader (DL-based OCR)
reader = easyocr.Reader(['en'])

def extract_text(image_path):
    # Tesseract (Primary - Faster on CPU)
    try:
        # print("Running Tesseract...")
        img = Image.open(image_path)
        text_tesseract = pytesseract.image_to_string(img)
    except Exception as e:
        print(f"Tesseract OCR error: {str(e)}")
        text_tesseract = ""

    # EasyOCR (Secondary - Backup)
    # Only run if Tesseract failed significantly
    text_easyocr = ""
    if len(text_tesseract.strip()) < 20: # If less than 20 chars, Tesseract probably failed
        try:
            print("Running EasyOCR fallback...")
            result = reader.readtext(image_path)
            text_easyocr = " ".join([r[1] for r in result])
        except Exception as e:
            print(f"EasyOCR error: {str(e)}")
    else:
        text_easyocr = text_tesseract # Use Tesseract text if it worked

    return {
        "easyocr_text": text_easyocr,
        "tesseract_text": text_tesseract
    }


