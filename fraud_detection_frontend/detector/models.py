from django.db import models
from django.contrib.auth.models import User

# 1. Evidence Item (The core file entity)
class EvidenceItem(models.Model):
    """Represents the raw uploaded evidence (file)"""
    
    # User who uploaded
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evidence_items')
    
    # File information
    uploaded_file = models.FileField(upload_to='documents/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Soft Delete & Audit (File lifecycle)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_evidence')
    deletion_reason = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = 'Evidence Item'
        verbose_name_plural = 'Evidence Items'
    
    def __str__(self):
        return f"{self.filename} ({self.uploaded_at.strftime('%Y-%m-%d %H:%M')})"

# 2. Automated Scan (The AI Intelligence)
class AutomatedScan(models.Model):
    """Stores the AI analysis results for an evidence item"""
    
    DOCUMENT_TYPES = [
        ('invoice', 'Invoice'),
        ('receipt', 'Receipt'),
        ('bank_statement', 'Bank Statement'),
        ('purchase_order', 'Purchase Order'),
        ('expense_report', 'Expense Report'),
        ('check', 'Check'),
        ('unknown', 'Unknown'),
    ]
    
    RISK_LEVELS = [
        ('low_risk', 'Low Risk'),
        ('medium_risk', 'Medium Risk'),
        ('high_risk', 'High Risk'),
        ('non_financial', 'Non Financial'),
    ]
    
    # Link to Evidence
    evidence = models.OneToOneField(EvidenceItem, on_delete=models.CASCADE, related_name='scan')
    
    # AI Backend ID (FastAPI Hash)
    ai_analysis_id = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    
    # Analysis results
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES, default='unknown')
    detection_confidence = models.FloatField(default=0.0)
    
    final_score = models.FloatField(default=0.0)
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS, default='low_risk')
    
    # Detailed results (JSON)
    fraud_indicators = models.JSONField(default=list, blank=True)
    component_scores = models.JSONField(default=dict, blank=True)
    extracted_text = models.JSONField(default=dict, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    
    # Technical Status
    is_processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Automated Scan'
        verbose_name_plural = 'Automated Scans'

    def __str__(self):
        return f"Scan for {self.evidence.filename} - {self.risk_level}"

# 3. Forensic Review (The Human Verdict)
class ForensicReview(models.Model):
    """Stores the expert's decision/review on an evidence item"""
    
    REVIEW_STATUS_CHOICES = [
        ('not_requested', 'Not Requested'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    # Link to Evidence
    evidence = models.OneToOneField(EvidenceItem, on_delete=models.CASCADE, related_name='review')
    
    # Review Details
    status = models.CharField(max_length=20, choices=REVIEW_STATUS_CHOICES, default='not_requested')
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews_conducted')
    reviewed_at = models.DateTimeField(auto_now=True)
    
    notes = models.TextField(blank=True, help_text="Expert notes on the verdict")
    
    class Meta:
        verbose_name = 'Forensic Review'
        verbose_name_plural = 'Forensic Reviews'

    def __str__(self):
        return f"Review for {self.evidence.filename}: {self.status}"
