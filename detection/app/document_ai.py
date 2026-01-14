import requests
import os

# Get API key from environment variable for security
API_URL = "https://api-inference.huggingface.co/models/naver-clova-ix/donut-base-finetuned-cord-v2"
API_KEY = os.getenv("HUGGINGFACE_API_KEY")  # Get from environment variable
HEADERS = {
    "Authorization": API_KEY
}

def document_understanding(image_path):
    try:
        with open(image_path, "rb") as f:
            data = f.read()
        
        response = requests.post(API_URL, headers=HEADERS, data=data, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Document AI API error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Document AI request failed: {str(e)}")
        return None
    except Exception as e:
        print(f"Document understanding error: {str(e)}")
        return None
