# System Design Documentation

## 1. Entity Relationship Diagram (ERD)

The following diagram illustrates the relationship between the core entities in the Fraud Detection System.

```mermaid
erDiagram
    User ||--o{ EvidenceItem : "uploads"
    User ||--o{ ForensicReview : "conducts"
    
    EvidenceItem ||--|| AutomatedScan : "has result"
    EvidenceItem ||--|| ForensicReview : "has verdict"

    User {
        int id PK
        string username
        string email
        boolean is_staff
        boolean is_expert
    }

    EvidenceItem {
        bigint id PK
        int user_id FK
        string filename
        string uploaded_file
        datetime uploaded_at
        boolean is_deleted
    }

    AutomatedScan {
        bigint id PK
        bigint evidence_id FK
        string ai_analysis_id
        float final_score
        string risk_level
        json fraud_indicators
        boolean is_processed
    }

    ForensicReview {
        bigint id PK
        bigint evidence_id FK
        int reviewer_id FK
        string status
        text notes
        datetime reviewed_at
    }
```

## 2. Data Flow Diagrams (DFD)

### Level 0: Context Diagram

This overview shows the high-level interaction between the User, the System (SentryAI), the Forensic Expert, the System Admin, and the External AI Service.

```mermaid
graph TD
    User[User / Officer] -->|1. Uploads Document| System(SentryAI System)
    System -->|2. Returns Risk Score & Indicators| User
    
    System -->|3. Flags High Risk Cases| Expert[Forensic Expert]
    Expert -->|4. Reviews Evidence| System
    Expert -->|5. Submits Verdict (Reject/Verify)| System
    
    Admin[System Admin] -->|9. User Management & Config| System
    System -->|10. Audit Logs & Reports| Admin

    System -->|6. Updates Case Status| User

    System -->|7. Sends Document for Analysis| API[External Detection API]
    API -->|8. Returns Analysis Results| System
```

### Level 1: User Workflow

Detailed flow of how a standard user works with the system.

```mermaid
graph LR
    User((User))
    ProcessUpload[1.0 Upload Handler]
    ProcessAI[2.0 AI Analysis Engine]
    ProcessDashboard[3.0 Dashboard View]
    ExtAPI[Detection API]
    DB[(Database)]

    User -->|Post File| ProcessUpload
    ProcessUpload -->|Save Evidence| DB
    ProcessUpload -->|Trigger Scan| ProcessAI
    
    ProcessAI -->|Fetch File| DB
    ProcessAI -->|Send File| ExtAPI
    ExtAPI -->|Return Predictions| ProcessAI
    ProcessAI -->|Save AutomatedScan| DB
    
    User -->|View Results| ProcessDashboard
    ProcessDashboard -->|Query Evidence & Scans| DB
    ProcessDashboard -->|Display Report| User
```

### Level 1: Forensic Expert Workflow

Detailed flow of how an expert reviews and adjudicates cases.

```mermaid
graph LR
    Expert((Expert))
    ProcessQueue[4.0 Review Queue]
    ProcessReview[5.0 Review Action]
    DB[(Database)]

    ProcessQueue -->|Query Pending Reviews| DB
    DB -->|List of Cases| Expert
    
    Expert -->|Select Case| ProcessReview
    ProcessReview -->|Fetch Full Evidence| DB
    
    Expert -->|Submit Verdict (Approve/Reject) + Notes| ProcessReview
    ProcessReview -->|Update ForensicReview| DB
    
    ProcessReview -->|Notify System| DB
```

### Level 1: System Administration

Backend management flow.

```mermaid
graph TD
    Admin((System Admin))
    DjangoAdmin[Django Admin Panel]
    DB[(Database)]

    Admin -->|Manage Users| DjangoAdmin
    Admin -->|Audit Logs| DjangoAdmin
    Admin -->|Force Delete Evidence| DjangoAdmin
    
    DjangoAdmin -->|CRUD Operations| DB
```
