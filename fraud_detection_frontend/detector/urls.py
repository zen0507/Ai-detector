from django.urls import path
from . import views
from . import api

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('upload/', views.upload_document, name='upload_document'),
    path('results/<int:pk>/', views.analysis_results, name='analysis_results'),
    path('analyses/', views.analysis_list, name='analysis_list'),
    path('delete/<int:pk>/', views.delete_analysis, name='delete_analysis'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    
    # API Endpoints — Original
    path('api/register/', api.api_register, name='api_register'),
    path('api/login/', api.api_login, name='api_login'),
    path('api/upload/', api.api_upload, name='api_upload'),
    path('api/dashboard/', api.api_dashboard, name='api_dashboard'),
    path('api/reports/', api.api_reports, name='api_reports'),
    path('api/reports/<int:pk>/', api.api_report_detail, name='api_report_detail'),
    path('api/delete/<int:pk>/', api.api_delete_analysis, name='api_delete_analysis'),
    path('api/generate_pdf/<int:pk>/', api.api_generate_pdf, name='api_generate_pdf'),
    path('api/review/<int:pk>/', api.api_review_analysis, name='api_review_analysis'),
    path('api/review_hash/<str:ai_id>/', api.api_review_by_hash, name='api_review_by_hash'),

    # API Endpoints — New Dashboard
    path('api/stats/', api.api_stats, name='api_stats'),
    path('api/daily-stats/', api.api_daily_stats, name='api_daily_stats'),
    path('api/recent/', api.api_recent_documents, name='api_recent_documents'),
    path('api/chart-data/', api.api_chart_data, name='api_chart_data'),
    path('api/storage/', api.api_storage_info, name='api_storage_info'),
    path('api/me/', api.api_me, name='api_me'),
    path('api/me/update/', api.api_me_update, name='api_me_update'),
    path('api/me/change-password/', api.api_change_password, name='api_change_password'),
    path('api/me/preferences/', api.api_preferences, name='api_preferences'),
    path('api/expert-queue/', api.api_expert_queue, name='api_expert_queue'),
    path('api/expert-decision/<int:pk>/', api.api_expert_decision, name='api_expert_decision'),
    path('api/document/<int:pk>/', api.api_document_detail, name='api_document_detail'),
    path('api/expert/stats/', api.api_expert_stats, name='api_expert_stats'),
    path('api/expert/completed/', api.api_expert_completed, name='api_expert_completed'),
    
    # Admin Panel APIs
    path('api/admin/stats/', api.api_admin_stats, name='api_admin_stats'),
    path('api/admin/users/', api.api_admin_users, name='api_admin_users'),
    path('api/admin/users/create/', api.api_admin_create_user, name='api_admin_create_user'),
    path('api/admin/users/<int:pk>/', api.api_admin_user_detail, name='api_admin_user_detail'),
    path('api/admin/documents/', api.api_admin_documents, name='api_admin_documents'),
    path('api/admin/analytics/', api.api_admin_analytics, name='api_admin_analytics'),
    path('api/admin/health/', api.api_system_health, name='api_system_health'),
    path('api/admin/assign-expert/<int:pk>/', api.api_admin_assign_expert, name='api_admin_assign_expert'),
    path('api/admin/audit-logs/', api.api_admin_audit_logs, name='api_admin_audit_logs'),
]
