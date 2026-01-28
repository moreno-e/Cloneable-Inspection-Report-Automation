# Agentic RPA System - Inspection Report Automation

AI-powered system that automates field inspection data entry into legacy permit systems using Claude Vision and adaptive agents.

## 🎯 What This Demonstrates

This project showcases **agentic RPA** - using AI to adaptively automate repetitive tasks across varying systems:

1. **AI Data Extraction** - Claude reads ANY report format (JSON, text, different schemas) and extracts structured data
2. **Vision-Based Form Analysis** - Claude Vision "sees" forms and identifies fields without hardcoded selectors
3. **Adaptive Form Filling** - Agent fills forms by understanding layout, not by memorizing IDs
4. **Multi-System Orchestration** - Coordinates agents to process reports and file permits across multiple systems

### Why This Matters

**Traditional RPA Problem:**
```typescript
// Hardcoded for Wake County
await page.fill('#location', data);

// Breaks when Durham County uses different IDs!
await page.fill('#site-address', data);  // Different selector = broken script
```

**Our Agentic Solution:**
```typescript
// Works for ANY form layout
const fields = await analyzeFormWithVision(screenshot);
// Claude finds the right selectors by looking at the form
```

## 🏗️ Architecture

```
Inspection Report (drone/sensor/robot)
         ↓
    [Data Extractor Agent]
    - Reads any format (JSON, text, CSV)
    - Extracts: location, damage type, severity, notes
         ↓
    [Orchestrator]
    - Coordinates workflow
    - Error handling & retry logic
         ↓
    [Form Filler Agent] × N forms
    - Takes screenshot
    - Claude Vision identifies fields
    - Fills form adaptively
    - Submits
         ↓
    Results & Reporting
```

## 🎬 Demo Scenario

**Real-world use case:**

A utility company's drone inspects a damaged power pole. The system needs to:
1. Read the inspection report (could be any format from various devices)
2. File permits with 3 different counties (Wake, Durham, Cary)
3. Each county has a completely different permit portal

**Manual process:** 30-60 minutes per inspection (log into portals, copy-paste, fill forms)

**Traditional RPA:** Write 3 separate scripts with hardcoded selectors (breaks when UIs change)

**Our Agentic RPA:** ONE system adapts to all 3 forms automatically (~60 seconds total)

## 🚀 Quick Start

### Prerequisites

1. Node.js 18+ installed
2. Anthropic API key ([Get one here](https://console.anthropic.com/))

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file with your API key
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# 3. Run the full demo
npm start
```

### What You'll See

The system will:
1. ✅ Extract data from an inspection report
2. ✅ Open Wake County form → analyze → fill → submit
3. ✅ Open Durham County form → analyze → fill → submit
4. ✅ Open Cary City form → analyze → fill → submit
5. ✅ Show comprehensive results

Total runtime: ~60 seconds (3 forms)

## 📋 Available Commands

```bash
npm start              # Run full orchestration demo (all 3 forms)
npm run demo           # Same as npm start
npm run test:extract   # Test data extraction only
npm run test:forms     # Test form filling only
npm run build          # Compile TypeScript
```

## 🧪 Test Different Scenarios

Edit `src/index.ts` and change `SELECTED_SCENARIO`:

```typescript
const SELECTED_SCENARIO = 'scenario1';  // All 3 forms (default)
// const SELECTED_SCENARIO = 'scenario2';  // Durham only (faster)
// const SELECTED_SCENARIO = 'scenario3';  // Cary only (different report format)
```

## 📁 Project Structure

```
src/
├── agents/
│   ├── data-extractor.ts      # AI-powered report parsing
│   └── form-filler.ts         # Vision-based form automation
├── forms/
│   ├── wake-county-form.html  # Traditional gov website
│   ├── durham-county-form.html # Modern gradient design
│   └── cary-city-form.html    # Corporate blue layout
├── inspection-reports/
│   ├── report1.json           # Structured drone report
│   ├── report2.txt            # Text-based sensor report
│   └── report3.json           # Different JSON schema
├── utils/
│   ├── claude-client.ts       # Anthropic API wrapper
│   └── types.ts               # TypeScript definitions
├── orchestrator.ts            # Main workflow coordinator
└── index.ts                   # Entry point & demo runner
```

## 🔑 Key Concepts

### 1. Data Extraction with AI

Claude reads reports in ANY format and extracts the same logical data:

```typescript
// Works for JSON, text, different schemas, even PDFs!
const data = await extractInspectionData(reportPath);
// Always returns: { location, damageType, severity, notes }
```

### 2. Vision-Based Field Identification

Claude Vision analyzes screenshots to find form fields:

```typescript
const screenshot = await page.screenshot();
const fields = await analyzeFormWithVision(screenshot);
// Returns: [{ fieldName: "location", selector: "#site-address", fieldType: "input" }]
```

Claude understands:
- "Site Address" label → this is the location field
- Field has `id="site-address"` → use that selector
- It's a text input → use `.fill()` method

### 3. Intelligent Dropdown Matching

Forms have different options for the same concept:

- Wake County: "Structural Damage"
- Durham County: "Structural Concern"
- Cary City: "Pole Damage"

System intelligently maps damage types to available options.

### 4. Orchestration Pattern

Coordinator agent manages specialized agents:
- Data Extractor → extracts information
- Form Filler → fills forms
- Orchestrator → coordinates, handles errors, aggregates results

## 💡 Production Enhancements

This demo shows core concepts. For production, you'd add:

**Scaling:**
- Parallel form filling (`Promise.all()`)
- Queue system (Redis/RabbitMQ)
- Distributed workers

**Reliability:**
- Retry logic with exponential backoff
- Circuit breakers for failing systems
- Comprehensive error handling

**Monitoring:**
- OpenTelemetry tracing
- Metrics dashboards (Grafana)
- Alert system (Slack/PagerDuty)

**Cost Optimization:**
- Cache Claude Vision results (field mappings don't change often)
- Cache extracted data
- Use Haiku model for simple tasks

**Security:**
- Credential management (Vault)
- Audit logging
- Sandboxed browser execution

## 🎤 Interview Talking Points

**What I Built:**
"An agentic RPA system that uses Claude Vision to automate data entry across legacy permit systems without hardcoded selectors."

**Technical Highlights:**
- ✅ Vision-based field identification (adapts to UI changes)
- ✅ AI data extraction (handles format variations)
- ✅ Orchestration pattern (specialized agents + coordinator)
- ✅ Error handling at each step
- ✅ TypeScript for type safety

**Real-World Impact:**
"For utilities filing permits with 50 different counties, this means ONE codebase instead of 50 separate scripts. When a county updates their portal, the system adapts automatically."

**What I Learned:**
- Anthropic's Vision API for UI understanding
- Playwright for browser automation
- Orchestration patterns for agentic systems
- Production considerations: retry logic, caching, monitoring

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development
- **Playwright** - Headless browser automation
- **Anthropic Claude API** - LLM for data extraction
- **Claude Vision** - Visual form analysis
- **Node.js** - Runtime environment

## 📚 Learning Resources

See `LEARNING_NOTES.md` for detailed explanations of:
- Prompt engineering
- Async/await patterns
- Vision API usage
- Base64 encoding
- Browser automation
- Agentic orchestration

## 📄 License

ISC

---

**Built as a demo project for interview preparation with Cloneable.ai**

Demonstrates understanding of:
- AI-powered automation (agentic systems)
- Legacy system integration
- Vision-based UI interaction
- Production-ready architecture patterns
