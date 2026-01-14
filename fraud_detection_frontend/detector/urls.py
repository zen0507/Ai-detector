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
    
    # API Endpoints
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
]
