from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
import os

class DocumentUploadForm(forms.Form):
    """Form for uploading financial documents"""
    
    document = forms.FileField(
        label='Upload Financial Document',
        help_text='Supported formats: JPG, PNG, TIFF, BMP, WebP (Max 10MB)',
        widget=forms.FileInput(attrs={
            'accept': 'image/*',
            'class': 'form-control'
        })
    )
    
    def clean_document(self):
        document = self.cleaned_data.get('document')
        
        if document:
            # Check file extension
            allowed_extensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.webp']
            ext = os.path.splitext(document.name)[1].lower()
            
            if ext not in allowed_extensions:
                raise forms.ValidationError(
                    f'Unsupported file type. Allowed: {", ".join(allowed_extensions)}'
                )
            
            # Check file size (max 10MB)
            if document.size > 10 * 1024 * 1024:
                raise forms.ValidationError('File size must be under 10MB')
        
        return document


class UserRegistrationForm(UserCreationForm):
    """Enhanced user registration form"""
    
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Email Address'
        })
    )
    
    first_name = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'First Name'
        })
    )
    
    last_name = forms.CharField(
        max_length=30,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Last Name'
        })
    )
    
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Username'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Password'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Confirm Password'
        })
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        if commit:
            user.save()
        return user


class UserLoginForm(AuthenticationForm):
    """Enhanced login form"""
    
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Username'
        })
    )
    
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Password'
        })
    )
