# OutOfOffice

AI-powered trip planner that finds where your PTO goes furthest. Enter your days off, destination, and budget. OutOfOffice scores every possible window, prices real flights, and returns ranked itineraries you can book in one click.

## Preview

| Trip Planner | Results | Expanded Trip | Refine Results |
|:---:|:---:|:---:|:---:|
| ![Trip Planner](https://github.com/user-attachments/assets/06edb6ff-42b4-48c5-951f-1bb50c206343) | ![Results](https://github.com/user-attachments/assets/55454c15-b9aa-46d5-b90a-0c0db255e897) | ![Expanded Itinerary](https://github.com/user-attachments/assets/627daa4e-dcb1-4fa8-80d8-79b98a164836) | ![Refined Results](https://github.com/user-attachments/assets/92c52833-13d8-47e7-95cf-b5e915de6abf) |

## Tech Stack

**Frontend**

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Backend**

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white) ![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white) ![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**Infrastructure**

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) ![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

## How it works

```mermaid
flowchart TD
    A([Open OutOfOffice]) --> B[Enter departure, destination,\nPTO days, and optional budget]
    B --> C[Choose priority\nbest yield / lowest cost / most time / least PTO]
    C --> D[Submit]
    D --> E[View ranked recommendations\nwith real flight prices and itineraries]
    E --> F{Satisfied?}
    F -->|yes| G([Book on Kayak])
    F -->|no| H[Type feedback\ne.g. cheaper flights or longer trip]
    H --> I[Pipeline resumes from saved checkpoint\nno full rerun]
    I --> E
```

```mermaid
sequenceDiagram
    participant Browser
    participant FastAPI
    participant LangGraph
    participant Redis
    participant OpenAI
    participant SerpAPI
    participant NagerDate

    Browser->>FastAPI: POST /api/trip
    FastAPI->>LangGraph: ainvoke(initial_state)
    LangGraph->>NagerDate: fetch public holidays for current and next year
    LangGraph->>SerpAPI: search outbound + return flights per window in parallel
    LangGraph->>OpenAI: rank enriched windows by priority (gpt-4o)
    LangGraph->>OpenAI: build day-by-day itineraries in parallel (gpt-4o)
    LangGraph->>Redis: save checkpoint and pause
    FastAPI-->>Browser: TripPlannerResponse with thread_id and recommendations

    Browser->>FastAPI: POST /api/trips/{thread_id}/feedback
    FastAPI->>Redis: load checkpoint
    FastAPI->>LangGraph: ainvoke(None) to resume from pause point
    LangGraph->>OpenAI: parse feedback into updated constraints (gpt-4o)
    LangGraph->>SerpAPI: re-search flights with new constraints
    LangGraph->>OpenAI: re-rank and rebuild itineraries
    LangGraph->>Redis: save updated checkpoint and pause
    FastAPI-->>Browser: updated TripPlannerResponse
```

```mermaid
flowchart TD
    START([New request]) --> planner
    planner["Planner\nScore every PTO window for the year by yield.\nFilter by preferred months and min PTO days."] --> travel
    travel["Travel\nFetch outbound + return flights via SerpAPI.\n2 one-way calls per window, run in parallel."] --> rank_check{Flights found?}
    rank_check -->|no| END1([End])
    rank_check -->|yes| ranker
    ranker["Ranker\nGPT-4o sorts windows by user priority.\nbest yield / lowest cost / most/least PTO"] --> rec_check{Recommendations\nproduced?}
    rec_check -->|no| END2([End])
    rec_check -->|yes| itinerary
    itinerary["Itinerary\nGPT-4o builds a day-by-day plan\nper recommendation in parallel."] --> pause
    pause([Interrupt -- full state saved to Redis]) --> feedback_check{User feedback\nsubmitted?}
    feedback_check -->|no| END3([End -- return results])
    feedback_check -->|yes| feedback
    feedback["Feedback\nGPT-4o translates natural language\ninto updated request constraints."] --> planner
```

The backend is a FastAPI service orchestrating a five-node LangGraph state machine. `planner` scores every valid PTO window in the year by yield ratio (total days off divided by PTO used) and filters by the user's month and minimum-day preferences; `travel` fans out concurrent SerpAPI requests — two one-way calls per window, because SerpAPI has no round-trip endpoint — and attaches the cheapest pairing to each window; `ranker` sends enriched windows to GPT-4o for priority-aware ranking, and `itinerary` generates day-by-day plans in parallel for each recommendation. After `itinerary` completes, LangGraph pauses with `interrupt_after` and checkpoints the full graph state to Redis; the `/feedback` endpoint later loads that checkpoint and resumes execution from the pause point, so only `feedback -> planner -> ... -> itinerary` re-runs rather than the entire pipeline. Redis also backs the slowapi rate limiter, keeping both the checkpoint store and per-IP counters on a single external dependency.

## Running it locally

```bash
cp .env.example .env   # fill in SERPAPI_API_KEY and OPENAI_API_KEY
docker compose up
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |

## Running tests

```bash
# Backend
cd backend
python -m pytest
```

```bash
# Frontend
cd frontend
npm test
```

## Deploying

The frontend deploys to Vercel and the backend to Render. Both auto-deploy on push to `main`.

**Frontend — Vercel**
1. Import the repo; set root directory to `frontend/`
2. Add environment variable: `VITE_API_BASE_URL` = your Render backend URL (set after step 2)

**Backend — Render**
1. Create a Web Service; set root directory to `backend/`, Dockerfile path to `./Dockerfile`
2. Create a Redis instance; copy its internal connection string to `REDIS_URL`
3. Set environment variables: `OPENAI_API_KEY`, `SERPAPI_API_KEY`, `REDIS_URL`, `CORS_ORIGINS` (your Vercel URL)
