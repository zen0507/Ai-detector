import requests
from typing import Dict, Any
from django.conf import settings

class FastAPIClient:
    """Client to communicate with FastAPI fraud detection backend"""
    
    def __init__(self):
        self.base_url = settings.FASTAPI_URL
    
    def analyze_document(self, file_path: str) -> Dict[str, Any]:
        """
        Send document to FastAPI for analysis
        
        Args:
            file_path: Path to the uploaded file
            
        Returns:
            Analysis results from FastAPI
        """
        url = f"{self.base_url}/analyze-document"
        print(f"DEBUG: FastAPIClient connecting to: {url}")
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(url, files=files, timeout=180)
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"FastAPI request failed: {str(e)}")
    
    def analyze_invoice(self, file_path: str) -> Dict[str, Any]:
        """
        Send invoice specifically to FastAPI
        
        Args:
            file_path: Path to the uploaded invoice
            
        Returns:
            Analysis results from FastAPI
        """
        url = f"{self.base_url}/analyze-invoice"
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(url, files=files, timeout=180)
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"FastAPI request failed: {str(e)}")
    
    def health_check(self) -> bool:
        """Check if FastAPI backend is running"""
        url = f"{self.base_url}/health"
        
        try:
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except:
            return False
