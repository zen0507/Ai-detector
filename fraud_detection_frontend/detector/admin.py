from django.contrib import admin
from .models import EvidenceItem, AutomatedScan, ForensicReview

class AutomatedScanInline(admin.StackedInline):
    model = AutomatedScan
    can_delete = False
    verbose_name_plural = 'Automated Scan Results'
    fk_name = 'evidence'
    readonly_fields = ['fraud_indicators', 'component_scores', 'extracted_text']

class ForensicReviewInline(admin.StackedInline):
    model = ForensicReview
    can_delete = False
    verbose_name_plural = 'Expert Review'
    fk_name = 'evidence'

@admin.register(EvidenceItem)
class EvidenceItemAdmin(admin.ModelAdmin):
    list_display = ['filename', 'user', 'uploaded_at', 'is_deleted']
    list_filter = ['uploaded_at', 'is_deleted']
    search_fields = ['filename', 'user__username']
    inlines = [AutomatedScanInline, ForensicReviewInline]

@admin.register(AutomatedScan)
class AutomatedScanAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'risk_level', 'final_score', 'document_type']
    list_filter = ['risk_level', 'document_type']

@admin.register(ForensicReview)
class ForensicReviewAdmin(admin.ModelAdmin):
    list_display = ['evidence', 'status', 'reviewer', 'reviewed_at']
    list_filter = ['status']
