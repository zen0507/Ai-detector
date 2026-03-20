from django.shortcuts import render, redirect, get_object_or_404
from django.utils.safestring import mark_safe
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.contrib import messages
from django.db.models import Count
from django.conf import settings
from .models import EvidenceItem

from .forms import DocumentUploadForm, UserRegistrationForm, UserLoginForm
from .api_client import FastAPIClient

# NOTE: These views are largely deprecated in favor of React + api.py
# Kept minimal for legacy routing compatibility if needed

def register(request):
    # Redirect to React Frontend
    return redirect('http://localhost:5173/register' if settings.DEBUG else 'dashboard')

def user_login(request):
    # Redirect to React Frontend
    return redirect('http://localhost:5173/login' if settings.DEBUG else 'dashboard')

def user_logout(request):
    logout(request)
    return redirect('http://localhost:5173/login' if settings.DEBUG else 'login')


def upload_document(request):
    return redirect('http://localhost:5173/upload')

def analysis_results(request, pk):
    return redirect(f'http://localhost:5173/results/{pk}')

def dashboard(request):
    # This is now a simple landing/placeholder that doesn't trigger loops
    return render(request, 'detector/dashboard.html', {})

def analysis_list(request):
    return render(request, 'detector/analysis_list.html', {})

def delete_analysis(request, pk):
    return redirect('dashboard')

