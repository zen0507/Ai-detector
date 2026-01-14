
"""
File Type Identifier Module
Identifies the technical file type (MIME type, extension) of uploaded files.
"""
import mimetypes
import os

class FileTypeIdentifier:
    """Identifies the file type of a given file"""
    
    @staticmethod
    def identify_file_type(file_path: str) -> dict:
        """
        Identifies the type of file based on extension and mime type.
        
        Args:
            file_path (str): The absolute path to the file.
            
        Returns:
            dict: A dictionary containing 'mime_type', 'extension', and 'category'.
        """
        if not os.path.exists(file_path):
            return {"error": "File not found"}
            
        mime_type, encoding = mimetypes.guess_type(file_path)
        extension = os.path.splitext(file_path)[1].lower()
        
        # Determine category
        category = "unknown"
        if mime_type:
            if mime_type.startswith("image/"):
                category = "image"
            elif mime_type == "application/pdf":
                category = "document"
            elif mime_type.startswith("text/"):
                category = "text"
                
        return {
            "mime_type": mime_type or "application/octet-stream",
            "extension": extension,
            "encoding": encoding,
            "category": category
        }
