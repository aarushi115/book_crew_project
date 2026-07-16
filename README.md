# 📚 Multi-Agent Book Generation with CrewAI Flows

An automated, hierarchical book-writing engine powered by **CrewAI Flows** and **Groq's Llama 3.3 (70B)**. The system divides the writing process across two specialized multi-agent crews managed by an async state-machine pipeline — going from a single topic all the way to a fully assembled Markdown manuscript, in parallel.

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
│   _parse_outline() JSON parse   │  ──►  List[ChapterOutline] (Pydantic)
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

---

## ⚡ Key Features

- **Parallel chapter writing** via `asyncio.gather` — all chapters drafted concurrently, drastically cutting total runtime
- **Zero context drift** — each chapter writer receives the full `book_outline` as a JSON string, maintaining narrative alignment without exceeding token limits
- **Graceful parsing fallback** — `_parse_outline()` tries JSON first, falls back to a single-chapter stub so the flow never hard-crashes on malformed LLM output
- **100% free-tier friendly** — runs entirely on `groq/llama-3.3-70b-versatile`, no paid API needed

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| Agent Framework | CrewAI Flows (`>=0.80.0`) |
| LLM | Groq — `llama-3.3-70b-versatile` |
| Search | SerperDev API (`SerperDevTool`) |
| Schema / Types | Pydantic (`ChapterOutline`, `Chapter`) |
| Async Engine | Python `asyncio` |
| Output Format | Markdown (`output/book.md`) |

---

## 🚀 Getting Started

### Prerequisites

```bash
pip install "crewai[tools]>=0.80.0" python-dotenv
```

### Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
SERPER_API_KEY=your_serper_api_key
```

### Run

```bash
# From the repo root
python -m src.my_book.main

# Or if installed as a package via pyproject.toml
my_book
```

The topic and goal are pre-configured in `BookState`. Edit `main.py` to change them before running.

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
│   └── types.py                       # ChapterOutline, Chapter (Pydantic models)
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

---

## ⚠️ Known Gotcha

The `generate_outline` task must return **valid JSON** for chapter parsing to work reliably. Add this to the bottom of `tasks.yaml` under `generate_outline.description`:

```yaml
    IMPORTANT: Your final output must be a valid JSON array like:
    [{"title": "Chapter 1", "description": "..."}, ...]
    Output ONLY the JSON array, nothing else.
```

Without this, Llama may return prose instead of parseable JSON, triggering the fallback single-chapter stub.

---

## 🙏 Acknowledgements

- [CrewAI](https://github.com/joaomdmoura/crewAI) for the multi-agent framework
- [Groq](https://groq.com) for blazing-fast free-tier LLM inference
- [SerperDev](https://serper.dev) for live web search
