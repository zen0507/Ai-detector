from django.contrib import admin
from .models import EvidenceItem, AutomatedScan, ForensicReview, UserProfile

"""
FALSUM ROLE-BASED ACCESS CONTROL (RBAC) DOCUMENTATION

ROLES & CREATION PATHS:
1. Auditor: 
   - Path: Public React /register page.
   - Purpose: Standard users who upload and view document analysis.
   - Permission: Only allowed to see their own documents.

2. Forensic Expert:
   - Path: Django Admin Panel only.
   - Purpose: Professional auditors who review and verify AI verdicts.
   - Steps to Create:
     1. Go to Authentication and Authorization / Users.
     2. Create a new User with a secure password.
     3. Go to User Profiles.
     4. Create a new User Profile, select the user, and set Role to 'Forensic Expert'.
   - Permission: Can view all documents and perform reviews/verdicts.

3. Admin:
   - Path: Terminal (python manage.py createsuperuser).
   - Purpose: System maintenance, user management, and configuration.
   - Permission: Full access to the system and admin panel.

NOTE: The register API strictly blocks any role assignment other than 'auditor'.
"""

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('user__username', 'user__email')
    ordering = ('-created_at',)

@admin.register(EvidenceItem)
class EvidenceItemAdmin(admin.ModelAdmin):
    list_display = ('filename', 'user', 'uploaded_at', 'is_deleted')
    list_filter = ('is_deleted', 'uploaded_at')
    search_fields = ('filename', 'user__username')

@admin.register(AutomatedScan)
class AutomatedScanAdmin(admin.ModelAdmin):
    list_display = ('evidence', 'risk_level', 'final_score', 'document_type', 'is_processed')
    list_filter = ('risk_level', 'document_type', 'is_processed')
    search_fields = ('evidence__filename', 'ai_analysis_id')

@admin.register(ForensicReview)
class ForensicReviewAdmin(admin.ModelAdmin):
    list_display = ('evidence', 'status', 'reviewer', 'reviewed_at')
    list_filter = ('status', 'reviewed_at')
    search_fields = ('evidence__filename', 'reviewer__username')
