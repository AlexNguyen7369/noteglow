# NoteGlow - Complete Project Information & Development Logic

Comprehensive documentation for understanding the NoteGlow project structure, functionality, and development patterns used across all features.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Core Features & Implementation Logic](#core-features--implementation-logic)
5. [API Endpoints](#api-endpoints)
6. [Data Flow & Workflows](#data-flow--workflows)
7. [State Management](#state-management)
8. [Error Handling Strategy](#error-handling-strategy)
9. [Development Patterns](#development-patterns)
10. [File Structure](#file-structure)
11. [Deployment & Configuration](#deployment--configuration)
12. [Future Enhancements](#future-enhancements)

---

## Project Overview

### What is NoteGlow?

NoteGlow is a **web-based note-taking application** with **AI-powered note transformation features**. It allows students and professionals to:
- Write notes freely in a blank canvas editor
- Transform raw notes into structured, formatted content
- Extract and highlight key terms
- Generate AI-powered insights and comments
- Get instant definitions for key terms
- Save notes locally in the browser
- Download notes as text files

### Target Users

- Students taking class notes
- Professionals organizing thoughts
- Anyone wanting AI assistance with note organization

### Key Philosophy

**"Write freely, we'll organize them for you"** - The app prioritizes ease of note-taking over perfect structure, with AI helping to organize after the fact.

---

## Technology Stack

### Frontend
- **React 19.1.0** - UI framework
- **Next.js 15.5.4** - Full-stack framework with built-in API routes
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **react-icons 5.5.0** - Icon library (Feather icons)

### Backend
- **Next.js API Routes** - Serverless functions for API endpoints
- **Node.js runtime** - Server-side JavaScript execution

### Data & Validation
- **Zod 3.22.4** - Runtime schema validation
- **TypeScript inference** - Type-safe contracts between frontend and backend

### AI & Processing
- **HuggingFace Inference API** - Access to large language models
  - Model: `meta-llama/Llama-2-70b-chat-hf`
  - Chat completion interface for natural language tasks

### Storage
- **Browser localStorage** - Client-side persistent storage
  - No backend database (all data stays on user's device)
  - User retains full data ownership

### Deployment
- **Vercel** - Serverless hosting platform
  - Native Next.js support
  - Automatic deployments from GitHub
  - Environment variable management

---

## Architecture Overview

### Project Structure

```
noteglow/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── transform/
│   │   │   │   └── route.ts          # AI transformation endpoint
│   │   │   └── term-definition/
│   │   │       └── route.ts          # Term definition endpoint
│   │   ├── components/
│   │   │   └── NoteEditor.tsx        # Main UI component
│   │   ├── page.tsx                  # App entry point
│   │   ├── layout.tsx                # Global layout
│   │   └── globals.css               # Global styles
│   └── lib/
│       └── highlight.ts              # Keyword highlighting logic
├── public/                           # Static assets
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js config
├── vercel.json                       # Vercel deployment config
├── tailwind.config.ts                # Tailwind config
└── .env.local                        # Environment variables (local only)
```

### Component Hierarchy

```
App (page.tsx)
└── NoteEditor (components/NoteEditor.tsx)
    ├── Header (with toggle button)
    ├── Main Content
    │   └── Notes Editor Panel
    │       ├── Textarea (note input)
    │       ├── Stats Bar
    │       ├── Action Buttons (Save, Download, Clear)
    │       └── Fixed Transform Button
    ├── Sidebar (sliding panel)
    │   ├── Transform Options
    │   │   ├── Auto-Format checkbox
    │   │   ├── Highlight Key Terms checkbox
    │   │   └── Comments/Insight checkbox
    │   ├── Apply Transformation button
    │   ├── Results Display (dynamic)
    │   │   ├── Formatted Notes (with highlight.ts integration)
    │   │   ├── Key Terms (clickable)
    │   │   └── Comments/Insights
    └── Popups
        └── Term Definition Modal (minimal)
```

### API Endpoints

**Transform API**: `POST /api/transform`
- Handles AI-powered note transformation
- Orchestrates conditional prompt engineering
- Manages parallel API calls to HuggingFace

**Term Definition API**: `POST /api/term-definition`
- Generates concise definitions for individual terms
- Uses notes as context for relevance

---

## Core Features & Implementation Logic

### 1. Blank Canvas Note Editor

**File**: `src/app/components/NoteEditor.tsx` (lines 143-176, 210-240)

#### Functionality
- Textarea for unrestricted note-taking
- Real-time character count tracking
- Real-time word count calculation
- Visual feedback for saved state

#### Implementation Logic

```javascript
// State management
const [notes, setNotes] = useState("");
const [characterCount, setCharacterCount] = useState(0);

// Keystroke handler updates both notes and statistics
const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const content = e.target.value;
  setNotes(content);                          // Update notes
  setCharacterCount(content.length);          // Update character count
  setIsSaved(false);                          // Mark as unsaved
};

// Word count computed on render
notes.split(/\s+/).filter(w => w.length > 0).length

// localStorage persistence
localStorage.setItem("studentNotes", notes);
const savedNotes = localStorage.getItem("studentNotes");
```

#### Key Features
- ✅ Instant character/word count updates
- ✅ localStorage persistence (survives page reload)
- ✅ Visual "saved" indicator (2-second animation)
- ✅ Full-height responsive textarea
- ✅ Keyboard-accessible

---

### 2. Transform System (AI Formatting)

**Files**:
- `src/app/api/transform/route.ts` - Backend transformation logic
- `src/app/components/NoteEditor.tsx` (lines 109-148) - Frontend integration

#### Two-Step Workflow

**Step 1: Open Transform Panel** (No API call)
```javascript
const handleOpenTransformPanel = () => {
  setSidebarOpen(true);
  setTransformError(null);
};
```
- User clicks floating "Transform" button
- Sidebar slides in from right
- User configures options without delay

**Step 2: Confirm & Transform** (Makes API call)
```javascript
const handleConfirmTransform = async () => {
  setIsTransforming(true);
  const response = await fetch("/api/transform", {
    body: JSON.stringify({ notes, options: transformOptions })
  });
  const result = await response.json();
  setTransformResult(result);

  // Load all term definitions if highlighting enabled
  if (transformOptions.highlightKeyTerms && result.highlights.length > 0) {
    await loadTermDefinitions(result.highlights);
  }
};
```

#### Dynamic Prompt Steering

The API uses **conditional prompt engineering** to strictly enforce selected options:

```typescript
// Backend logic: src/app/api/transform/route.ts (lines 47-102)

let systemPrompt = "You are a careful study notes formatter...";
const instructions: string[] = [];

if (options.autoFormat) {
  instructions.push("Apply markdown formatting...");
} else {
  instructions.push("Do NOT apply any formatting changes...");
}

if (options.highlightKeyTerms) {
  instructions.push("Extract key terms as JSON array...");
} else {
  instructions.push("Do NOT extract or highlight any key terms...");
}

if (options.comments) {
  instructions.push("Generate helpful learning insights...");
} else {
  instructions.push("Do NOT generate any comments or insights...");
}

systemPrompt += `TRANSFORMATION CRITERIA:\n${instructions.join('\n')}`;
```

**Why this approach?**
- ✅ Explicit negations prevent unwanted features
- ✅ Model strictly follows user selections
- ✅ No wasted API tokens on unused features
- ✅ Predictable output structure

#### Zod Validation

```typescript
const TransformOptionsSchema = z.object({
  autoFormat: z.boolean(),
  highlightKeyTerms: z.boolean(),
  comments: z.boolean(),
});

const TransformRequestSchema = z.object({
  notes: z.string().min(1, 'Notes cannot be empty'),
  options: TransformOptionsSchema,
});

// Runtime validation with helpful error messages
const validatedData = TransformRequestSchema.parse(body);
```

#### Response Processing

```typescript
// Lines 179-204 of transform/route.ts

const transformResult = {
  formattedNotes: parsedResponse.formattedNotes || '',
  highlights: Array.isArray(parsedResponse.highlights)
    ? parsedResponse.highlights
    : [],
  comments: Array.isArray(parsedResponse.comments)
    ? parsedResponse.comments
    : [],
};

// Empty arrays for disabled features
// If highlightKeyTerms=false: highlights = []
// If comments=false: comments = []
```

---

### 3. Keyword Highlighting System

**File**: `src/lib/highlight.ts`

#### Problem Solved
When highlighting keywords, need to avoid:
- Highlighting partial words (e.g., "synthesis" inside "photosynthesis")
- Highlighting inside HTML tags (e.g., inside style attributes)
- Case sensitivity issues

#### Implementation Logic

```typescript
export function highlightKeyTerms(
  htmlContent: string,
  keyTerms: string[]
): string {
  // Sort terms by length descending (longest first)
  const sortedTerms = [...keyTerms].sort((a, b) => b.length - a.length);

  let result = htmlContent;

  for (const term of sortedTerms) {
    // Create case-insensitive word-boundary regex
    const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');

    result = result.replace(regex, (match) => {
      // Check if match is inside HTML tag
      const beforeMatch = result.substring(0, result.indexOf(match));
      const lastOpenBracket = beforeMatch.lastIndexOf('<');
      const lastCloseBracket = beforeMatch.lastIndexOf('>');

      // If open bracket after close bracket, we're inside a tag
      if (lastOpenBracket > lastCloseBracket) {
        return match; // Don't highlight
      }

      return `<mark>${match}</mark>`;
    });
  }

  return result;
}

// Helper: Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

#### Key Algorithm Decisions

1. **Sort by length (descending)**
   - "photosynthesis" (13 chars) before "synthesis" (9 chars)
   - Prevents partial replacements

2. **Word boundaries (`\b`)**
   - Matches at word edges only
   - Won't match "synthesis" inside "photosynthesis"

3. **Safe HTML tag detection**
   - Compares position of `<` and `>`
   - Skips highlighting inside tags (attributes, etc.)

#### Performance
- O(n*m) where n = terms, m = content length
- Acceptable for typical note sizes (< 10KB)
- Regex escaping prevents injection

---

### 4. Term Definition System (Hashmap)

**File**: `src/app/components/NoteEditor.tsx` (lines 35-42, 145-192)

#### Problem & Solution

**Before**: Single definition click made 1 API call (1-2 second wait)
**After**: All definitions preloaded, instant O(1) lookup

#### Implementation

```typescript
// State: Hashmap of term → definition
const [termDefinitions, setTermDefinitions] = useState<Record<string, string>>({});

// Load all definitions in parallel
const loadTermDefinitions = async (terms: string[]) => {
  setIsLoadingDefinitions(true);

  try {
    // Fetch all definitions in parallel
    const definitionPromises = terms.map((term) =>
      fetch("/api/term-definition", {
        body: JSON.stringify({ term, context: notes })
      })
        .then(res => res.json())
        .then(data => ({ term, definition: data.definition }))
        .catch(() => ({ term, definition: "Failed to load definition" }))
    );

    const definitions = await Promise.all(definitionPromises);

    // Create hashmap: { "term1": "definition1", "term2": "definition2", ... }
    const definitionsMap: Record<string, string> = {};
    definitions.forEach(({ term, definition }) => {
      definitionsMap[term] = definition;
    });

    setTermDefinitions(definitionsMap);
  } finally {
    setIsLoadingDefinitions(false);
  }
};

// Click handler: instant lookup (no API call!)
const handleTermClick = (term: string) => {
  setSelectedTerm(term);  // Definition already loaded from hashmap
};
```

#### Data Flow

```
Transform Button Clicked
  ↓
Transform API returns: { formattedNotes, highlights, comments }
  ↓
Check if highlightKeyTerms enabled && highlights exist
  ↓
Call loadTermDefinitions(["term1", "term2", "term3"])
  ↓
Parallel fetch for each term (Promise.all)
  ↓
Store in hashmap: { "term1": "def1", "term2": "def2", "term3": "def3" }
  ↓
User clicks term1 badge
  ↓
Instantly show definition from hashmap (no network call!)
```

#### Advantages

| Metric | Before (per click) | After (batch) |
|--------|-------------------|---------------|
| Latency per click | 1-2 seconds | < 10ms |
| Total API calls | 1 per click | 1 for all terms |
| Network utilization | Sequential | Parallel |
| User experience | Waiting | Instant |

---

### 5. Sliding Sidebar

**File**: `src/app/components/NoteEditor.tsx` (lines 252-447)

#### CSS Animation Logic

```javascript
// Sidebar container
className={`fixed top-0 right-0 h-full w-96 transform transition-transform duration-300 ${
  sidebarOpen ? 'translate-x-0' : 'translate-x-full'
}`}

// translate-x-0: sidebar visible (position: 0px)
// translate-x-full: sidebar off-screen right (position: 384px)
// transition-transform: smooth animation over 300ms
```

#### Responsive Design

```javascript
// Overlay (only on mobile)
{sidebarOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
       onClick={() => setSidebarOpen(false)} />
)}

// Toggle button (only on desktop when results exist)
{transformResult && (
  <button className="hidden lg:flex ...">
    Transform Results
  </button>
)}
```

#### Z-Index Hierarchy

- `z-40`: Mobile overlay (blocks main content)
- `z-50`: Term definition modal (above sidebar)

---

### 6. Term Definition Popup

**File**: `src/app/components/NoteEditor.tsx` (lines 513-548)

#### Minimal Design Approach

```javascript
{selectedTerm && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    onClick={() => setSelectedTerm(null)}  // Click outside closes
  >
    <div
      className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4"
      onClick={(e) => e.stopPropagation()}  // Prevent outside click closing
    >
      {/* Title with close button */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-bold text-gray-800">
          {selectedTerm}
        </h4>
        <button onClick={() => setSelectedTerm(null)}>
          <FiX size={20} />
        </button>
      </div>

      {/* Definition from hashmap */}
      <p className="text-gray-700 text-sm leading-relaxed">
        {isLoadingDefinitions
          ? <span className="text-gray-500">Loading...</span>
          : termDefinitions[selectedTerm]
          ? termDefinitions[selectedTerm]
          : <span className="text-gray-500">No definition</span>
        }
      </p>
    </div>
  </div>
)}
```

#### Interaction Pattern

- **Click term**: Opens modal
- **Click X button**: Closes modal
- **Click outside**: Closes modal (via outer div)
- **Instantly shows definition**: No loading spinner (already preloaded)

---

## API Endpoints

### POST /api/transform

**Purpose**: Transform notes using AI based on selected options

**Request**:
```json
{
  "notes": "Raw student notes text...",
  "options": {
    "autoFormat": true,
    "highlightKeyTerms": true,
    "comments": false
  }
}
```

**Response** (Success):
```json
{
  "formattedNotes": "## Topic 1\n- Point 1\n- Point 2\n...",
  "highlights": ["term1", "term2", "term3"],
  "comments": []
}
```

**Response** (Error):
```json
{
  "error": "Human-readable error message",
  "details": "Technical details for debugging"
}
```

**Status Codes**:
- `200` - Success
- `400` - Validation error (invalid request format)
- `401` - Authentication failed (invalid HF_TOKEN)
- `429` - Rate limit exceeded
- `500` - Server error
- `503` - Service unavailable (API overloaded)

**Validation** (Zod):
```typescript
TransformRequestSchema.parse({
  notes: string (min 1 char),
  options: {
    autoFormat: boolean,
    highlightKeyTerms: boolean,
    comments: boolean
  }
})
```

---

### POST /api/term-definition

**Purpose**: Generate AI definition for a single term

**Request**:
```json
{
  "term": "photosynthesis",
  "context": "Optional notes for context..."
}
```

**Response** (Success):
```json
{
  "term": "photosynthesis",
  "definition": "The process by which plants convert light energy into chemical energy, producing glucose and oxygen from carbon dioxide and water."
}
```

**Response** (Error):
```json
{
  "error": "Failed to fetch term definition",
  "details": "..."
}
```

**Key Features**:
- Context-aware definitions (uses notes for relevance)
- Concise output (1-3 sentences max)
- Low temperature (0.3) for consistency
- Individual term processing

---

## Data Flow & Workflows

### Complete Transform Workflow

```
User writes notes
  ↓
Clicks floating "Transform" button
  ↓
STEP 1: handleOpenTransformPanel()
  - setSidebarOpen(true)
  - Sidebar slides in from right
  - User sees transform options
  ↓
User selects options:
  ✓ Auto-Format
  ✓ Highlight Key Terms
  ✗ Comments
  ↓
STEP 2: User clicks "Apply Transformation"
  - handleConfirmTransform() called
  - setIsTransforming(true)
  ↓
POST /api/transform
{
  "notes": "Raw notes...",
  "options": { autoFormat: true, highlightKeyTerms: true, comments: false }
}
  ↓
Backend (transform/route.ts):
  1. Validate with Zod
  2. Build dynamic system prompt
  3. Add instructions for selected options only
  4. Call HuggingFace API
  5. Parse JSON response (handle markdown code blocks)
  6. Return filtered results
  ↓
Response received:
{
  "formattedNotes": "## Formatted...",
  "highlights": ["term1", "term2"],
  "comments": []
}
  ↓
setTransformResult(result)
  ↓
Check: autoFormat && highlightKeyTerms && highlights.length > 0
  - YES: Call loadTermDefinitions(highlights)
  ↓
loadTermDefinitions:
  - Map each term to API call
  - Promise.all() for parallel execution
  - Create hashmap when all complete
  - setTermDefinitions(hashmap)
  ↓
Sidebar updates with:
  ✓ Formatted Notes (with <mark> tags from highlight.ts)
  ✓ Key Terms (clickable buttons)
  ✓ Comments (empty array shown as nothing)
  ↓
User clicks "photosynthesis" badge
  ↓
handleTermClick("photosynthesis")
  - setSelectedTerm("photosynthesis")
  ↓
Modal appears with instant definition from hashmap
  ↓
User closes modal
  ↓
Can click other terms or close sidebar
```

### Data Persistence Flow

```
User writes notes
  ↓
Every keystroke:
  - setNotes(content)
  - setCharacterCount(content.length)
  - setIsSaved(false)
  ↓
User clicks "Save"
  ↓
handleSave():
  - localStorage.setItem("studentNotes", notes)
  - setIsSaved(true)
  - Show green "saved" indicator (2 sec)
  ↓
User closes browser
  ↓
Later: User returns to app
  ↓
useEffect on mount:
  - Get "studentNotes" from localStorage
  - If exists: setNotes(savedNotes)
  ↓
App restores to exact previous state
```

---

## State Management

### Component State Structure

```typescript
// Note content
const [notes, setNotes] = useState<string>("");

// Save indicator
const [isSaved, setIsSaved] = useState<boolean>(false);

// Statistics
const [characterCount, setCharacterCount] = useState<number>(0);

// UI - Sidebar
const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

// Transform options
const [transformOptions, setTransformOptions] = useState<{
  autoFormat: boolean;
  highlightKeyTerms: boolean;
  comments: boolean;
}>({
  autoFormat: false,
  highlightKeyTerms: false,
  comments: false,
});

// Transform process
const [isTransforming, setIsTransforming] = useState<boolean>(false);
const [transformResult, setTransformResult] = useState<TransformResult | null>(null);
const [transformError, setTransformError] = useState<string | null>(null);

// Term definitions
const [termDefinitions, setTermDefinitions] = useState<Record<string, string>>({});

// Term popup
const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
const [isLoadingDefinitions, setIsLoadingDefinitions] = useState<boolean>(false);
```

### State Update Patterns

**Controlled Input**:
```javascript
<textarea
  value={notes}
  onChange={handleNotesChange}
/>
// Updates both notes and characterCount on every keystroke
```

**Optimistic Updates**:
```javascript
setIsSaved(true);
setTimeout(() => setIsSaved(false), 2000);
// Immediately show success, then hide after 2 seconds
```

**Loading States**:
```javascript
setIsTransforming(true);
// Make API call
setIsTransforming(false);
// Show loading spinner during request
```

---

## Error Handling Strategy

### Validation Errors (400)

```typescript
try {
  const validatedData = TransformRequestSchema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      error: 'Invalid request format',
      details: error.errors
    }, { status: 400 });
  }
}
```

**Frontend handling**:
```javascript
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error);
}
```

### Authentication Errors (401)

```typescript
if (!process.env.HF_TOKEN) {
  return NextResponse.json({
    error: 'HF_TOKEN not set. Please configure in environment variables.'
  }, { status: 401 });
}
```

### Rate Limit Errors (429)

```typescript
if (error.message.includes('429') || error.message.includes('rate')) {
  return NextResponse.json({
    error: 'Rate limit exceeded. Please try again later.'
  }, { status: 429 });
}
```

### API Errors (503)

```typescript
if (responseContent.toLowerCase().includes('error') ||
    responseContent.toLowerCase().includes('internal')) {
  return NextResponse.json({
    error: 'HuggingFace API returned an error. Please try again.'
  }, { status: 503 });
}
```

### User-Facing Error Display

```javascript
{transformError && (
  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4">
    <p className="font-semibold">Transformation Error</p>
    <p className="text-sm mt-1">{transformError}</p>
  </div>
)}
```

---

## Development Patterns

### 1. Zod Runtime Validation

**Why**: Catch type errors at runtime, not just at compile time

```typescript
const RequestSchema = z.object({
  notes: z.string().min(1, 'Notes cannot be empty'),
  options: z.object({
    autoFormat: z.boolean(),
  })
});

const validated = RequestSchema.parse(JSON.parse(request.body));
```

### 2. TypeScript Type Inference

**Why**: Maintain type safety across frontend/backend boundary

```typescript
// Backend defines types
export type TransformResult = {
  formattedNotes: string;
  highlights: string[];
  comments: string[];
};

// Frontend imports and uses types
import type { TransformResult } from "../api/transform/route";
const [transformResult, setTransformResult] = useState<TransformResult | null>(null);
```

### 3. Conditional Feature Flags

**Why**: Disable features without removing code, control API usage

```typescript
if (options.autoFormat) {
  instructions.push("Apply formatting...");
} else {
  instructions.push("Do NOT apply formatting...");
}
```

### 4. Parallel Promise Execution

**Why**: Faster API calls when loading multiple definitions

```typescript
const promises = terms.map(term => fetchDefinition(term));
const results = await Promise.all(promises);
```

### 5. Error Recovery with Fallbacks

**Why**: Graceful degradation when APIs fail

```typescript
.catch(() => ({
  term,
  definition: "Failed to load definition"
}))
```

### 6. localStorage Persistence

**Why**: Data survives page reloads, no backend database needed

```typescript
// Save
localStorage.setItem("studentNotes", notes);

// Load
const savedNotes = localStorage.getItem("studentNotes");
```

### 7. Regex Word Boundaries

**Why**: Accurate keyword matching without false positives

```typescript
const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
// \b = word boundary, prevents partial matches
```

---

## File Structure

### Key Files & Responsibilities

| File | Purpose | Key Functions |
|------|---------|---------------|
| `src/app/page.tsx` | App entry point | Imports and renders NoteEditor |
| `src/app/components/NoteEditor.tsx` | Main UI component | State management, event handlers, layout |
| `src/app/api/transform/route.ts` | Transform API | Zod validation, prompt engineering, HF API calls |
| `src/app/api/term-definition/route.ts` | Definition API | Term definition generation |
| `src/lib/highlight.ts` | Keyword highlighting | regex matching, HTML-safe highlighting |
| `src/app/layout.tsx` | Global layout | HTML structure, metadata |
| `src/app/globals.css` | Global styles | Base Tailwind setup |
| `tailwind.config.ts` | Tailwind config | Custom theme settings |
| `tsconfig.json` | TypeScript config | Compilation settings, path aliases |
| `next.config.ts` | Next.js config | Framework customization |
| `package.json` | Dependencies | npm packages, scripts |
| `vercel.json` | Vercel config | Deployment settings |
| `.env.local` | Environment vars | API keys (local only) |

---

## Deployment & Configuration

### Vercel Deployment

**Step 1: Connect GitHub**
- Vercel watches for new commits
- Auto-builds on push to main branch

**Step 2: Environment Variables**
```
HF_TOKEN = hf_your_huggingface_token
```
- Required for API calls
- Set in Vercel dashboard Settings → Environment Variables
- Available in both development and production

**Step 3: Build Command**
```bash
npm run build
```
- Compiles TypeScript
- Builds Next.js app
- Validates with ESLint

**Step 4: Start Command**
```bash
npm start
```
- Runs production server
- Vercel handles scaling

### Local Development

**Installation**:
```bash
npm install
```

**Development Server**:
```bash
npm run dev
```
- Runs on http://localhost:3000
- Hot reload on file changes
- Uses .env.local for environment variables

**Build & Test**:
```bash
npm run build
```
- Checks for TypeScript errors
- Runs ESLint validation
- Creates production build

---

## Future Enhancements

### Planned Features (from README.md)

| Feature | Priority | Complexity | Status |
|---------|----------|-----------|--------|
| Blank Canvas Editor | High | Low | ✅ Complete |
| Transform Button | High | Low | ✅ Complete |
| AI Formatting | High | Medium | ✅ Complete |
| Keyword Highlighting | High | Medium | ✅ Complete |
| AI Comments Panel | High | Medium | ✅ Complete |
| Note History/Versioning | Medium | Medium | ⏳ Planned |
| Export to PDF | Medium | Low | ⏳ Planned |
| Dark Mode | Low | Low | ⏳ Planned |

### Implementation Ideas

**Note History/Versioning**:
- Store versions in localStorage with timestamps
- Show version timeline
- Rollback to previous versions

**Export to PDF**:
- Use library like `html2pdf` or `jsPDF`
- Include formatted notes and metadata
- Server-side option via Vercel function

**Dark Mode**:
- Add theme toggle in header
- Store preference in localStorage
- Use Tailwind's dark mode classes

### Alternative AI Providers

**If HuggingFace quotas exceeded**:
- **OpenAI API** - chatgpt-3.5-turbo
- **Anthropic Claude** - claude-instant
- **Groq API** - mixtral-8x7b (free tier)
- **Together AI** - various models

**Migration effort**: Medium (20-30 lines per API file)

---

## Glossary

| Term | Definition |
|------|-----------|
| **Zod** | Runtime schema validation library for TypeScript |
| **Prompt Engineering** | Crafting API instructions to guide model behavior |
| **Hashmap** | O(1) lookup data structure (JavaScript object/Map) |
| **localStorage** | Browser API for persistent client-side storage |
| **Vercel** | Serverless hosting platform for Next.js apps |
| **HuggingFace** | Platform providing access to open-source AI models |
| **Word Boundary** | `\b` in regex, matches at word edges |
| **ESLint** | Code quality and style checker for JavaScript |
| **Turbopack** | Fast bundler for Next.js development |
| **TypeScript** | Superset of JavaScript with static typing |

---

## Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zod Docs**: https://zod.dev
- **HuggingFace Docs**: https://huggingface.co/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Document Version**: 1.0
**Last Updated**: October 26, 2025
**Maintained By**: NoteGlow Development Team
