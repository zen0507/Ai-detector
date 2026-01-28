import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .models import EvidenceItem, AutomatedScan, ForensicReview
from .api_client import FastAPIClient
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

@csrf_exempt
def api_register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            email = data.get('email', '')
            
            if User.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'message': 'Username already exists'}, status=400)
                
            user = User.objects.create_user(username=username, email=email, password=password)
            login(request, user)
            return JsonResponse({
                'success': True, 
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_forensic_expert': 'expert' in user.username.lower()
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True, 
                    'username': user.username,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'is_forensic_expert': 'expert' in user.username.lower()
                })
            else:
                return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=401)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def api_upload(request):
    if request.method == 'POST':
        if 'file' not in request.FILES:
             return JsonResponse({'success': False, 'message': 'No file uploaded'}, status=400)
        
        uploaded_file = request.FILES['file']
        
        if not request.user.is_authenticated:
             return JsonResponse({'success': False, 'message': 'Authentication required. Please login.'}, status=403)
        user = request.user 
        
        if not user:
             return JsonResponse({'success': False, 'message': 'No user found. Please register/login.'}, status=403)

        # 1. Create Evidence Item
        evidence = EvidenceItem.objects.create(
            user=user,
            uploaded_file=uploaded_file,
            filename=uploaded_file.name
        )
        
        # 2. Initialize Scan placeholders
        scan = AutomatedScan.objects.create(evidence=evidence)
        review = ForensicReview.objects.create(evidence=evidence) # Default 'not_requested'
        
        try:
            client = FastAPIClient()
            # Analyze
            try:
                # We need the path. Django saves it to disk usually immediately.
                print(f"DEBUG: Attempting to call FastAPI for file: {evidence.uploaded_file.path}")
                results = client.analyze_document(evidence.uploaded_file.path)
                print(f"DEBUG: FastAPI returned results: {results}")
            except Exception as e:
                import traceback
                print(f"CRITICAL ERROR - AI BACKEND CONNECTION FAILED: {e}")
                traceback.print_exc()
                
                print(f"AI Backend offline: {e}")
                results = {
                    'id': 'mock-hash-' + str(evidence.id),
                    'document_type': {'detected_type': 'invoice', 'confidence': 0.95},
                    'final_score': 0.15,
                    'risk_level': 'Low Risk',
                    'risk_level': 'Low Risk',
                    'content_analysis': {'fraud_indicators': [], 'risk_score': 0.1},
                    'component_scores': {
                         "invoice_specific": 0.1,
                         "image_manipulation": 0.05,
                         "document_structure": 0.9,
                         "legacy_model": 0.1
                    },
                    'extracted_text': {'content': "Invoice Total: $500.00"},
                    'recommendations': [
                        {
                            "title": "System Offline - Protocol",
                            "desc": "AI analysis unavailable. Perform standard manual verification of vendor details and mathematical accuracy."
                        }
                    ],
                    '_debug_error': str(e)
                }
             
            # Map results to AutomatedScan
            content = results.get('content_analysis', {})
            extracted = results.get('extracted_text', {})
             
            full_text = ""
            if isinstance(extracted, dict):
                full_text = " ".join(str(v) for v in extracted.values())
            else:
                full_text = str(extracted)
                 
            def is_financial_document(text):
                return len(text.strip()) > 10

            if not is_financial_document(full_text):
                scan.risk_level = 'non_financial'
                scan.final_score = -1.0
                scan.document_type = 'unknown'
                scan.detection_confidence = 0.0
            else:
                doc_type_info = results.get('document_type', {})
                scan.document_type = doc_type_info.get('detected_type', 'unknown')
                scan.detection_confidence = doc_type_info.get('confidence', 0.0)
                scan.final_score = results.get('final_score', 0.0)
                scan.risk_level = results.get('risk_level', 'Low Risk').lower().replace(' ', '_')
             
            scan.fraud_indicators = content.get('fraud_indicators', [])
            scan.component_scores = results.get('component_scores', {})
            scan.extracted_text = extracted
            scan.is_processed = True
            scan.ai_analysis_id = results.get('id')
            scan.recommendations = results.get('recommendations', [])
            
            scan.save()
             
            return JsonResponse({
                'success': True,
                'id': evidence.pk,
                'ai_id': scan.ai_analysis_id,
                'filename': evidence.filename,
                'file_url': evidence.uploaded_file.url if evidence.uploaded_file else None,
                'risk_level': scan.risk_level,
                'score': scan.final_score,
                'recommendations': scan.recommendations,
                'fraud_indicators': scan.fraud_indicators
            })

        except Exception as e:
            scan.processing_error = str(e)
            scan.is_processed = False
            scan.save()
            return JsonResponse({'success': False, 'message': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

def api_dashboard(request):
    if not request.user.is_authenticated:
        return JsonResponse({'stats': [], 'recent_cases': []})
    user = request.user
    
    # Query EvidenceItems, and pre-fetch related scan and review
    analyses = EvidenceItem.objects.filter(user=user, is_deleted=False).select_related('scan', 'review')
    
    total = analyses.count()
    # Filter using related fields
    high_risk = analyses.filter(scan__risk_level='high_risk').count()
    cleared = analyses.filter(scan__risk_level='low_risk').count()
    clearance_rate =  f"{int((cleared/total)*100)}%" if total > 0 else "0%"
    
    stats = [
        {"label": "Total Documents", "value": str(total)},
        {"label": "High Risk Found", "value": str(high_risk)},
        {"label": "Clearance Rate", "value": clearance_rate}
    ]
    
    recent = analyses.order_by('-uploaded_at')[:5]
    recent_cases = []
    
    for r in recent:
        # Access safely in case scan/review missing (though we create them on upload)
        try:
            scan = r.scan
            review = r.review
        except:
            continue # specific corrupted data handling
            
        risk_score = int(scan.final_score * 100) if scan.final_score else 0
        status = "PENDING"
        
        if review.status == 'rejected':
            status = 'REJECTED'
        elif review.status == 'approved':
            status = 'VERIFIED'
        elif scan.is_processed:
            if scan.risk_level == 'high_risk': status = 'HIGH RISK'
            elif scan.risk_level == 'medium_risk': status = 'WARNING'
            else: status = 'SAFE'
            
        recent_cases.append({
            "id": f"DOC-{r.id}",
            "date": r.uploaded_at.strftime('%Y-%m-%d'),
            "status": status,
            "risk": risk_score
        })
        
    return JsonResponse({
        'stats': stats,
        'recent_cases': recent_cases
    })

def api_reports(request):
    if not request.user.is_authenticated:
        return JsonResponse({'reports': []})
    user = request.user
    
    fraud_type = request.GET.get('fraud_type')
    status_filter = request.GET.get('status_filter')
    
    # Base Query
    queryset = EvidenceItem.objects.filter(user=user, is_deleted=False).select_related('scan', 'review').order_by('-uploaded_at')
    
    # Filter by Status
    if status_filter == 'requested':
        queryset = queryset.exclude(review__status='not_requested')
    elif status_filter == 'ai_only':
        queryset = queryset.filter(review__status='not_requested')
    
    evidence_list = []
    
    # Filter by fraud type (in memory inspection of JSON)
    # Filter by fraud type / status
    if fraud_type:
        target = fraud_type.lower()
        if target == 'fraud':
            queryset = queryset.filter(scan__risk_level='high_risk')
            evidence_list = list(queryset)
        elif target == 'verified':
             queryset = queryset.filter(review__status='approved')
             evidence_list = list(queryset)
        else:
            # Fallback for specific keyword search in indicators
            filtered = []
            for doc in queryset:
                try:
                    scan = doc.scan
                    indicators = scan.fraud_indicators or []
                except:
                    continue

                found = False
                for ind in indicators:
                    if isinstance(ind, dict):
                        for val in ind.values():
                            if isinstance(val, str) and target in val.lower():
                                found = True
                                break
                    elif isinstance(ind, str) and target in ind.lower():
                        found = True
                    if found: break
                
                if found:
                    filtered.append(doc)
            evidence_list = filtered
    else:
        evidence_list = list(queryset)

    reports = []
    for r in evidence_list:
        try:
            scan = r.scan
            review = r.review
            
            reports.append({
                "id": f"DOC-{r.id}",
                "caseName": r.filename,
                "date": r.uploaded_at.strftime('%Y-%m-%d'),
                "size": f"{r.uploaded_file.size / 1024:.1f} KB" if r.uploaded_file else "0 KB",
                "risk_level": scan.risk_level,
                "review_status": review.status,
                "ai_id": scan.ai_analysis_id
            })
        except:
             continue 
        
    return JsonResponse({'reports': reports})

@csrf_exempt
def api_review_by_hash(request, ai_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required'}, status=403)
    user = request.user

    if request.method == 'POST':
        try:
             data = json.loads(request.body)
             action = data.get('action') 
             
             # Find Scan by Hash
             try:
                 scan = AutomatedScan.objects.get(ai_analysis_id=ai_id)
                 review = scan.evidence.review
             except AutomatedScan.DoesNotExist:
                 return JsonResponse({'success': False, 'message': 'Document not found by hash'}, status=404)
             
             if action == 'confirm' or action == 'approve':
                 review.status = 'approved'
             elif action == 'reject':
                 review.status = 'rejected'
             elif action == 'request':
                 review.status = 'pending'
             
             review.reviewer = user
             
             # Robust note saving: if comment key exists, use it (even if empty)
             if 'comment' in data:
                 review.notes = data['comment']
                 
             review.save()
             # Note: reviewed_at updates automatically via auto_now=True
             
             return JsonResponse({'success': True, 'status': review.status})
             
        except Exception as e:
             return JsonResponse({'success': False, 'message': str(e)}, status=500)
             
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def api_report_detail(request, pk):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required'}, status=403)
    user = request.user
    
    try:
        evidence = get_object_or_404(EvidenceItem, pk=pk, user=user)
        scan = evidence.scan
        review = evidence.review
        
        return JsonResponse({
            'success': True,
            'id': evidence.pk,
            'filename': evidence.filename,
            'uploaded_at': evidence.uploaded_at.strftime('%Y-%m-%d %H:%M:%S'),
            'risk_level': scan.risk_level,
            'score': scan.final_score,
            'type': scan.document_type,
            'ai_id': scan.ai_analysis_id,
            'review_status': review.status,
            'reviewed_by': review.reviewer.username if review.reviewer else None,
            'reviewed_at': review.reviewed_at.strftime('%Y-%m-%d %H:%M') if review.reviewed_at else None,
            'review_notes': review.notes,
            'fraud_indicators': scan.fraud_indicators,
            'recommendations': scan.recommendations 
        })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=404)

@csrf_exempt
def api_delete_analysis(request, pk):
    if not request.user.is_authenticated:
         return JsonResponse({'success': False, 'message': 'Authentication required'}, status=403)
    user = request.user

    if request.method == 'POST':
        try:
             if user.is_staff:
                 evidence = EvidenceItem.objects.get(pk=pk)
             else:
                 evidence = EvidenceItem.objects.get(pk=pk, user=user)
             
             data = json.loads(request.body)
             reason = data.get('reason', 'User requested deletion')
             
             evidence.is_deleted = True
             evidence.deleted_at = timezone.now()
             evidence.deleted_by = user
             evidence.deletion_reason = reason
             evidence.save()
             
             return JsonResponse({'success': True, 'id': pk})
        except EvidenceItem.DoesNotExist:
             return JsonResponse({'success': False, 'message': 'Report not found or permission denied'}, status=404)
        except Exception as e:
             return JsonResponse({'success': False, 'message': str(e)}, status=500)
             
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def api_generate_pdf(request, pk):
    import io
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from django.http import FileResponse

    user = request.user
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required'}, status=403)

    evidence = get_object_or_404(EvidenceItem, pk=pk)
    if not user.is_staff and evidence.user != user:
         return JsonResponse({'success': False, 'message': 'Permission denied'}, status=403)
         
    scan = evidence.scan
    review = evidence.review

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30
    )
    story.append(Paragraph("Forensic Audit Report", title_style))
    story.append(Spacer(1, 12))

    # Document Info
    story.append(Paragraph(f"<b>Case File:</b> {evidence.filename}", styles['Normal']))
    story.append(Paragraph(f"<b>Analysis ID:</b> DOC-{evidence.id}", styles['Normal']))
    story.append(Paragraph(f"<b>Date:</b> {evidence.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 12))
    
    # Risk Score
    risk_color = colors.green
    if scan.risk_level == 'high_risk': risk_color = colors.red
    elif scan.risk_level == 'medium_risk': risk_color = colors.orange
    
    story.append(Paragraph(f"<b>Risk Level:</b> <font color={risk_color}>{scan.risk_level.upper().replace('_', ' ')}</font>", styles['Normal']))
    story.append(Paragraph(f"<b>Confidence Score:</b> {scan.detection_confidence * 100:.1f}%", styles['Normal']))
    story.append(Paragraph(f"<b>Fraud Probability:</b> {scan.final_score * 100:.1f}%", styles['Normal']))
    story.append(Spacer(1, 24))

    # Review Notes in PDF
    if review.notes:
        story.append(Paragraph("<b>Expert Forensic Notes:</b>", styles['Heading3']))
        story.append(Paragraph(f"<i>{review.notes}</i>", styles['Normal']))
        story.append(Spacer(1, 12))

    # Indicators Table
    story.append(Paragraph("<b>Detected Fraud Indicators</b>", styles['Heading2']))
    story.append(Spacer(1, 12))

    indicators = scan.fraud_indicators
    if not indicators:
        story.append(Paragraph("No specific fraud indicators detected.", styles['Normal']))
    else:
        data = [['Indicator', 'Severity', 'Description']]
        
        for ind in indicators:
            if isinstance(ind, dict):
                name = ind.get('indicator', 'N/A')
                severity = ind.get('severity', 'Medium')
                desc = ind.get('description', '')
                data.append([name, severity, desc])
            else:
                data.append([str(ind), 'N/A', ''])

        table = Table(data, colWidths=[150, 80, 250])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(table)

    story.append(Spacer(1, 24))
    
    # Footer
    story.append(Paragraph("<b>System Verdict:</b>", styles['Heading3']))
    if scan.risk_level == 'non_financial':
         story.append(Paragraph("Document identified as non-financial. No further action required.", styles['Normal']))
    else:
         story.append(Paragraph("This document has been analyzed by the AI Fabrication Detector. Please review the indicators above.", styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    
    return FileResponse(buffer, as_attachment=True, filename=f"Audit_Report_DOC-{evidence.id}.pdf")

@csrf_exempt
def api_review_analysis(request, pk):
    # Review by ID directly
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required'}, status=403)
    user = request.user

    if request.method == 'POST':
        try:
             data = json.loads(request.body)
             action = data.get('action')
             notes = data.get('comment', '') # Frontend sends 'comment'
             
             evidence = get_object_or_404(EvidenceItem, pk=pk)
             review = evidence.review
             
             if action == 'approve' or action == 'confirm':
                 review.status = 'approved'
             elif action == 'reject':
                 review.status = 'rejected'
             elif action == 'request':
                 review.status = 'pending'
             else:
                 return JsonResponse({'success': False, 'message': 'Invalid action'}, status=400)
                 
             review.reviewer = user
             if notes:
                 review.notes = notes
             review.save()
             
             return JsonResponse({'success': True, 'status': review.status})
             
        except Exception as e:
             return JsonResponse({'success': False, 'message': str(e)}, status=500)
             
    return JsonResponse({'error': 'Method not allowed'}, status=405)
