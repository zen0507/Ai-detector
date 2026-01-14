from django.shortcuts import render, redirect, get_object_or_404
from django.utils.safestring import mark_safe
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.contrib import messages
from django.db.models import Count
from .models import EvidenceItem
from .forms import DocumentUploadForm, UserRegistrationForm, UserLoginForm
from .api_client import FastAPIClient

# NOTE: These views are largely deprecated in favor of React + api.py
# Kept minimal for legacy routing compatibility if needed

def register(request):
    return redirect('dashboard')

def user_login(request):
    return redirect('dashboard')

def user_logout(request):
    logout(request)
    return redirect('login')

@login_required
def upload_document(request):
    # Deprecated view
    return render(request, 'detector/upload.html', {'form': DocumentUploadForm()})

@login_required
def analysis_results(request, pk):
    return redirect('dashboard')

@login_required
def dashboard(request):
    return render(request, 'detector/dashboard.html', {})

@login_required
def analysis_list(request):
    return render(request, 'detector/analysis_list.html', {})

@login_required
def delete_analysis(request, pk):
    return redirect('dashboard')
