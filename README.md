# 📚 Multi-Agent Book Generation with CrewAI Flows

An automated, hierarchical book-writing engine powered by **CrewAI Flows** and **Google's Gemini 3.1 Flash Lite**. The system divides the writing process across two specialized multi-agent crews managed by an async state-machine pipeline — going from a single topic all the way to a fully assembled Markdown manuscript, served through a **FastAPI backend** and rendered on a **Vite + React** frontend.

---

## 🏗️ Architecture

```
[User Input: Topic & Goal]  ← hardcoded defaults in BookState
          │
          ▼
┌─────────────────────────────────┐
│       OutlineCrew Execution     │  ──►  SerperDevTool (web search)
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│    _parse_outline() JSON parse  │  ──►  List[ChapterOutline] (Pydantic)
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│    Async Concurrency Engine     │  ──►  asyncio.gather()
└─────────────────────────────────┘
     ┌────┴────┬────┴────┐
     ▼         ▼         ▼
┌─────────┐┌─────────┐┌─────────┐
│Chapter 1││Chapter 2││Chapter N│  ──►  WriteBookChapterCrews (parallel)
└─────────┘└─────────┘└─────────┘
          │
          ▼
┌─────────────────────────────────┐
│       save_book() listener      │  ──►  output/book.md
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│        FastAPI Backend          │  ──►  Serves the finished manuscript
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│     Vite + React Frontend       │  ──►  Renders the final assembled book
└─────────────────────────────────┘
```

### Core Components

**`BookFlow` & `BookState` — Orchestration Layer**
`BookState` holds `title`, `topic`, `goal`, `book_outline: List[ChapterOutline]`, and `book: List[Chapter]` — all pre-configured with defaults (no runtime prompt). `BookFlow` drives the pipeline via three `@start` / `@listen` steps: `generate_book_outline` → `write_chapters` → `save_book`.

**Crew 1 — `OutlineCrew`**
Handles research and chapter planning.
- *Researcher Agent* — uses `SerperDevTool` for live web search
- *Outliner Agent* — consolidates research into a sequential chapter plan
- *Output* — raw text parsed by `_parse_outline()` into `List[ChapterOutline]` (each with `title` + `description`); falls back gracefully if JSON parsing fails

**Crew 2 — `WriteBookChapterCrew`**
Spawned once per chapter, runs concurrently.
- *Researcher Agent* — uses `SerperDevTool`, scoped to a single chapter's title + description
- *Writer Agent* — writes ~3,000 words of Markdown per chapter, with the full book outline passed as context for narrative consistency

**FastAPI Backend — Serving Layer**
Wraps the `BookFlow` pipeline and exposes it over REST. Once generation completes, the backend returns the generated manuscript directly from the Flow's state memory as structured JSON to the frontend.

**Vite + React Frontend — Presentation Layer**
A lightweight React app (bundled with Vite) that calls the FastAPI backend and displays the final assembled book in a clean, readable, chapter-by-chapter view once generation completes.

---

## ⚡ Key Features

- **Parallel chapter writing** via `asyncio.gather` — all chapters drafted concurrently, drastically cutting total runtime
- **Zero context drift** — each chapter writer receives the full `book_outline` as a JSON string, maintaining narrative alignment without exceeding token limits
- **Graceful parsing fallback** — `_parse_outline()` tries JSON first, falls back to a single-chapter stub so the flow never hard-crashes on malformed LLM output
- **Decoupled frontend/backend** — FastAPI serves the generated manuscript over REST, and the React frontend renders it independently of the generation pipeline
- **Free/low-cost friendly** — runs on Gemini 3.1 Flash Lite, a fast and inexpensive model well suited to high-volume generation tasks

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| Agent Framework | CrewAI Flows (`>=0.80.0`) |
| LLM | Google Gemini — `gemini-3.1-flash-lite` |
| Search | SerperDev API (`SerperDevTool`) |
| Schema / Types | Pydantic (`ChapterOutline`, `Chapter`) |
| Async Engine | Python `asyncio` |
| Backend API | FastAPI |
| Frontend | Vite + React |
| Output Format | Markdown (`output/book.md`) |

---

## 🚀 Getting Started

### Prerequisites

```bash
pip install "crewai[tools]>=0.80.0" python-dotenv fastapi uvicorn google-generativeai
```

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
SERPER_API_KEY=your_serper_api_key
```

### Run the Backend

```bash
# From the repo root — starts the FastAPI server which runs the flow
uvicorn src.my_book.api:app --reload
```

### Run the Frontend

```bash
cd frontend
npm run dev
```

The topic and goal are pre-configured in `BookState`. Edit `main.py` to change them before running.

> **Note:** adjust the `uvicorn` module path above (`src.my_book.api:app`) to match wherever your FastAPI app instance actually lives in your project.

---

## 📁 Project Structure

```
my_book/
├── src/my_book/
│   ├── crews/
│   │   ├── outline_book_crew/
│   │   │   ├── config/
│   │   │   │   ├── agents.yaml       # researcher + outliner agent configs
│   │   │   │   └── tasks.yaml        # research_topic + generate_outline tasks
│   │   │   └── outline_crew.py       # OutlineCrew definition
│   │   └── write_book_chapter_crew/
│   │       ├── config/
│   │       │   ├── agents.yaml       # researcher + writer agent configs
│   │       │   └── tasks.yaml        # research_chapter + write_chapter tasks
│   │       └── write_book_chapter_crew.py
│   ├── __init__.py
│   ├── main.py                        # BookFlow + BookState + entry point
│   ├── api.py                         # FastAPI app serving the generated book
│   └── types.py                       # ChapterOutline, Chapter (Pydantic models)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Fetches + renders the finished book
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── output/
│   └── book.md                        # Generated manuscript (auto-created)
├── .env
└── pyproject.toml
```

---

## 📖 How It Works

1. `BookState` initialises with a hardcoded `topic` and `goal` (edit these in `main.py`)
2. `generate_book_outline` kicks off `OutlineCrew`, which researches the topic and returns a chapter plan
3. `_parse_outline()` parses the raw output into `List[ChapterOutline]`; falls back to a stub chapter if JSON is malformed
4. `write_chapters` fans out to `N` parallel `WriteBookChapterCrew` instances via `asyncio.gather`, each receiving its chapter's title, description, and the full book outline for context
5. `save_book` assembles all chapters in order and writes the final manuscript to `output/book.md`
6. The FastAPI backend awaits the pipeline completion and then returns the generated manuscript directly from the Flow's state memory as structured JSON for the frontend to render.
7. The Vite + React frontend fetches the finished manuscript from the backend and renders it as a clean, readable book view

---

## ⚠️ Known Gotcha

The `generate_outline` task must return **valid JSON** for chapter parsing to work reliably. Add this to the bottom of `tasks.yaml` under `generate_outline.description`:

```yaml
    IMPORTANT: Your final output must be a valid JSON array like:
    [{"title": "Chapter 1", "description": "..."}, ...]
    Output ONLY the JSON array, nothing else.
```

Without this, the model may return prose instead of parseable JSON, triggering the fallback single-chapter stub.

---

## 🙏 Acknowledgements

- [CrewAI](https://github.com/joaomdmoura/crewAI) for the multi-agent framework
- [Google Gemini](https://ai.google.dev) for fast, low-cost LLM inference
- [SerperDev](https://serper.dev) for live web search
