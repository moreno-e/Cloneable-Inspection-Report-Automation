# System Flow Diagrams

Copy and paste these into Notion. Use `/code` and select "Mermaid" as the language.

---

## Overall System Architecture

```mermaid
graph TB
    Start([Inspection Report<br/>JSON/Text/CSV]) --> Orchestrator[🎯 Orchestrator<br/>Coordinates Workflow]

    Orchestrator --> DataExtractor[🤖 Data Extractor Agent<br/>AI-Powered Parsing]
    DataExtractor --> ExtractedData[(Structured Data<br/>location, damage, severity, notes)]

    ExtractedData --> FormFiller1[🤖 Form Filler Agent 1<br/>Wake County]
    ExtractedData --> FormFiller2[🤖 Form Filler Agent 2<br/>Durham County]
    ExtractedData --> FormFiller3[🤖 Form Filler Agent 3<br/>Cary City]

    FormFiller1 --> Result1[✅ Submission Result 1]
    FormFiller2 --> Result2[✅ Submission Result 2]
    FormFiller3 --> Result3[✅ Submission Result 3]

    Result1 --> Aggregator[📊 Results Aggregator]
    Result2 --> Aggregator
    Result3 --> Aggregator

    Aggregator --> Report([📋 Final Report<br/>3/3 Successful])

    style Start fill:#e1f5ff
    style Orchestrator fill:#fff4e6
    style DataExtractor fill:#f3e5f5
    style FormFiller1 fill:#e8f5e9
    style FormFiller2 fill:#e8f5e9
    style FormFiller3 fill:#e8f5e9
    style Report fill:#e1f5ff
```

---

## Detailed Data Extraction Flow

```mermaid
graph LR
    A([Inspection Report<br/>report1.json]) --> B{Data Extractor Agent}

    B --> C[Read File Content]
    C --> D[Send to Claude API]

    D --> E[Claude Analyzes<br/>Format & Content]
    E --> F{Extract Fields}

    F --> G[Location:<br/>1234 Power Line Rd]
    F --> H[Damage Type:<br/>Wood Rot]
    F --> I[Severity:<br/>Medium]
    F --> J[Notes:<br/>15% structural compromise...]

    G --> K[Validate & Normalize]
    H --> K
    I --> K
    J --> K

    K --> L[(Structured Data Object)]

    style A fill:#e3f2fd
    style B fill:#f3e5f5
    style L fill:#c8e6c9
    style E fill:#fff9c4
```

---

## Vision-Based Form Filling Flow

```mermaid
graph TB
    Start([Form URL]) --> Open[Open Form in Browser<br/>Playwright]

    Open --> Screenshot[Take Full-Page Screenshot<br/>PNG Image]
    Screenshot --> Base64[Convert to Base64<br/>Binary → Text]

    Base64 --> Vision[Send to Claude Vision API<br/>Image + Prompt]

    Vision --> Analyze[Claude Analyzes Screenshot<br/>- Reads field labels<br/>- Identifies input types<br/>- Finds selectors]

    Analyze --> Fields[Field Mappings Returned<br/><code>location: #site-address<br/>damageType: #issue-category<br/>severity: #urgency<br/>notes: #description</code>]

    Fields --> Fill{For Each Field}

    Fill --> |Input| FillText[Type Text Value<br/>page.fill selector, value]
    Fill --> |Select| FillDropdown[Match & Select Option<br/>page.selectOption selector, value]
    Fill --> |Textarea| FillNotes[Type Long Text<br/>page.fill selector, notes]

    FillText --> Check{All Fields<br/>Filled?}
    FillDropdown --> Check
    FillNotes --> Check

    Check --> |No| Fill
    Check --> |Yes| Submit[Click Submit Button<br/>page.click 'button[type=submit]']

    Submit --> Success([✅ Form Submitted])

    style Start fill:#e3f2fd
    style Vision fill:#f3e5f5
    style Analyze fill:#fff9c4
    style Fields fill:#c8e6c9
    style Success fill:#a5d6a7
```

---

## Complete End-to-End Workflow

```mermaid
sequenceDiagram
    participant User
    participant Orchestrator
    participant DataExtractor
    participant Claude
    participant FormFiller
    participant Vision
    participant Browser

    User->>Orchestrator: Run Demo<br/>(npm start)

    Note over Orchestrator: PHASE 1: Data Extraction
    Orchestrator->>DataExtractor: Extract data from report1.json
    DataExtractor->>DataExtractor: Read file content
    DataExtractor->>Claude: API Call: Extract fields
    Claude-->>DataExtractor: JSON: {location, damageType, severity, notes}
    DataExtractor-->>Orchestrator: ✅ Structured Data

    Note over Orchestrator: PHASE 2: Form Filling (Wake County)
    Orchestrator->>FormFiller: Fill wake-county-form.html
    FormFiller->>Browser: Open form & take screenshot
    Browser-->>FormFiller: Screenshot PNG
    FormFiller->>Vision: API Call: Identify fields
    Vision-->>FormFiller: Field mappings
    FormFiller->>Browser: Fill fields & submit
    Browser-->>FormFiller: ✅ Success
    FormFiller-->>Orchestrator: ✅ Wake County submitted

    Note over Orchestrator: PHASE 2: Form Filling (Durham County)
    Orchestrator->>FormFiller: Fill durham-county-form.html
    FormFiller->>Browser: Open form & take screenshot
    Browser-->>FormFiller: Screenshot PNG
    FormFiller->>Vision: API Call: Identify fields
    Vision-->>FormFiller: Field mappings (different IDs!)
    FormFiller->>Browser: Fill fields & submit
    Browser-->>FormFiller: ✅ Success
    FormFiller-->>Orchestrator: ✅ Durham County submitted

    Note over Orchestrator: PHASE 2: Form Filling (Cary City)
    Orchestrator->>FormFiller: Fill cary-city-form.html
    FormFiller->>Browser: Open form & take screenshot
    Browser-->>FormFiller: Screenshot PNG
    FormFiller->>Vision: API Call: Identify fields
    Vision-->>FormFiller: Field mappings (different IDs!)
    FormFiller->>Browser: Fill fields & submit
    Browser-->>FormFiller: ✅ Success
    FormFiller-->>Orchestrator: ✅ Cary City submitted

    Note over Orchestrator: PHASE 3: Results
    Orchestrator->>Orchestrator: Aggregate results
    Orchestrator-->>User: 📊 Final Report<br/>3/3 Successful ✅
```

---

## Agent Architecture

```mermaid
graph TB
    subgraph "Data Extractor Agent"
        DE1[Read Any Format<br/>JSON, Text, CSV]
        DE2[Claude Text API<br/>Extract structured data]
        DE3[Validate & Normalize<br/>Type checking]
    end

    subgraph "Form Filler Agent"
        FF1[Browser Automation<br/>Playwright]
        FF2[Screenshot Capture<br/>PNG → Base64]
        FF3[Claude Vision API<br/>Identify fields]
        FF4[Intelligent Matching<br/>Dropdown options]
        FF5[Fill & Submit<br/>Adaptive selectors]
    end

    subgraph "Orchestrator"
        O1[Workflow Coordination]
        O2[Error Handling<br/>Try/Catch]
        O3[Result Tracking<br/>Success/Failure]
        O4[Reporting<br/>Metrics & Summary]
    end

    DE1 --> DE2
    DE2 --> DE3

    FF1 --> FF2
    FF2 --> FF3
    FF3 --> FF4
    FF4 --> FF5

    O1 --> O2
    O2 --> O3
    O3 --> O4

    DE3 -.->|Structured Data| FF1

    style DE2 fill:#f3e5f5
    style FF3 fill:#f3e5f5
    style O1 fill:#fff4e6
```

---

## Traditional RPA vs Agentic RPA

```mermaid
graph TB
    subgraph "❌ Traditional RPA (Breaks on Changes)"
        T1[Inspection Report] --> T2[Hardcoded Parser<br/>Only works for specific format]
        T2 --> T3[Wake County Script<br/>await page.fill '#location']
        T2 --> T4[Durham County Script<br/>await page.fill '#site-address']
        T2 --> T5[Cary City Script<br/>await page.fill '#serviceLocation']

        T3 -.->|Form ID changes| T6[❌ BREAKS]
        T4 -.->|Form ID changes| T7[❌ BREAKS]
        T5 -.->|Form ID changes| T8[❌ BREAKS]
    end

    subgraph "✅ Agentic RPA (Adapts Automatically)"
        A1[Inspection Report<br/>Any Format] --> A2[Claude AI<br/>Understands any format]
        A2 --> A3[Vision-Based Filling<br/>Analyzes form visually]

        A3 --> A4[Wake County<br/>Finds #location]
        A3 --> A5[Durham County<br/>Finds #site-address]
        A3 --> A6[Cary City<br/>Finds #serviceLocation]

        A4 --> A7[✅ WORKS]
        A5 --> A7
        A6 --> A7

        A7 -.->|Form changes| A8[✅ Still works<br/>Re-analyzes visually]
    end

    style T2 fill:#ffebee
    style T6 fill:#ffcdd2
    style T7 fill:#ffcdd2
    style T8 fill:#ffcdd2

    style A2 fill:#e8f5e9
    style A3 fill:#e8f5e9
    style A7 fill:#c8e6c9
    style A8 fill:#c8e6c9
```

---

## Error Handling Flow

```mermaid
graph TB
    Start([Start Workflow]) --> Extract[Data Extraction]

    Extract -->|Success| Form1[Fill Form 1]
    Extract -->|Failure| Fail[❌ Fatal Error<br/>Cannot proceed]

    Form1 -->|Success| Track1[✅ Record Success]
    Form1 -->|Failure| Track1F[❌ Record Failure<br/>Continue anyway]

    Track1 --> Form2[Fill Form 2]
    Track1F --> Form2

    Form2 -->|Success| Track2[✅ Record Success]
    Form2 -->|Failure| Track2F[❌ Record Failure<br/>Continue anyway]

    Track2 --> Form3[Fill Form 3]
    Track2F --> Form3

    Form3 -->|Success| Track3[✅ Record Success]
    Form3 -->|Failure| Track3F[❌ Record Failure]

    Track3 --> Report[Generate Report<br/>Show all results]
    Track3F --> Report

    Report --> Check{All<br/>Successful?}
    Check -->|Yes| Success([🎉 100% Success])
    Check -->|Partial| Partial([⚠️ Partial Success])
    Check -->|No| AllFailed([❌ All Failed])

    style Extract fill:#fff9c4
    style Track1 fill:#c8e6c9
    style Track2 fill:#c8e6c9
    style Track3 fill:#c8e6c9
    style Track1F fill:#ffcdd2
    style Track2F fill:#ffcdd2
    style Track3F fill:#ffcdd2
    style Success fill:#a5d6a7
    style Partial fill:#fff59d
    style Fail fill:#ef5350
    style AllFailed fill:#ef5350
```

---

## Production Scaling Architecture

```mermaid
graph TB
    subgraph "Ingestion Layer"
        API[API Gateway<br/>Receives reports]
        Queue[(Redis Queue<br/>Pending jobs)]
    end

    subgraph "Processing Layer"
        W1[Worker 1<br/>Data Extraction]
        W2[Worker 2<br/>Data Extraction]
        W3[Worker 3<br/>Form Filling]
        W4[Worker 4<br/>Form Filling]
        W5[Worker 5<br/>Form Filling]
    end

    subgraph "AI Services"
        Claude[Claude API<br/>Text + Vision]
        Cache[(Redis Cache<br/>Field mappings)]
    end

    subgraph "Storage Layer"
        DB[(PostgreSQL<br/>Job tracking)]
        S3[(S3<br/>Screenshots & logs)]
    end

    subgraph "Monitoring"
        Metrics[Prometheus<br/>Metrics]
        Logs[CloudWatch<br/>Logs]
        Alerts[PagerDuty<br/>Alerts]
    end

    API --> Queue
    Queue --> W1
    Queue --> W2
    Queue --> W3
    Queue --> W4
    Queue --> W5

    W1 --> Claude
    W2 --> Claude
    W3 --> Claude
    W4 --> Claude
    W5 --> Claude

    Claude --> Cache

    W3 --> DB
    W4 --> DB
    W5 --> DB

    W3 --> S3
    W4 --> S3
    W5 --> S3

    DB --> Metrics
    Claude --> Metrics
    W1 --> Logs
    W3 --> Logs

    Metrics --> Alerts
    Logs --> Alerts

    style API fill:#e3f2fd
    style Queue fill:#fff9c4
    style Claude fill:#f3e5f5
    style Cache fill:#c8e6c9
    style Alerts fill:#ffcdd2
```

---

## How to Use in Notion

1. Copy any diagram above (including the ```mermaid markers)
2. In Notion, type `/code`
3. Select "Mermaid" as the language
4. Paste the diagram code
5. Notion will render it as an interactive diagram

You can resize, zoom, and export the diagrams directly in Notion!
