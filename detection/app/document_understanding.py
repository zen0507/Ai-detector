import requests
import json
import os

HF_API_URL = "https://api-inference.huggingface.co/models/naver-clova-ix/donut-base-finetuned-cord-v2"

# Use environment variable or fallback to provided key (from existing document_ai.py)
HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}"
}

def extract_invoice_fields(image_path):
    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        response = requests.post(
            HF_API_URL,
            headers=HF_HEADERS,
            data=image_bytes,
            timeout=30
        )

        if response.status_code != 200:
            print(f"Document understanding API error: {response.status_code} - {response.text}")
            return {}

        result = response.json()
        
        # Donut model sometimes returns a list or wrapped object, we want a dict
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        return result
        
    except requests.exceptions.Timeout:
        print("Document understanding API timeout")
        return {}
    except requests.exceptions.RequestException as e:
        print(f"Document understanding request failed: {e}")
        return {}
    except json.JSONDecodeError:
        print("Failed to decode JSON from Document understanding API")
        return {}
    except Exception as e:
        print(f"Unexpected error in document understanding: {e}")
        return {}
