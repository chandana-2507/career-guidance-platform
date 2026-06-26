# AI-Based Career Guidance Platform

A production-level career guidance platform for students with **multi-agent Gemini AI**, personalized recommendations, resume analysis, skill gap analysis, and CareerPilot AI counseling.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, Axios, React Router, Chart.js
- **Backend:** Node.js, Express.js, JWT, REST API
- **Database:** MongoDB with Mongoose
- **AI:** Google Gemini — **8 independent agents**, each with its own API key
- **Auth:** Google OAuth + JWT

## Multi-Agent AI Architecture

Each feature uses a dedicated Gemini API key to prevent quota exhaustion across modules:

| Agent | Env Variable | Feature |
|-------|--------------|---------|
| CareerPilot AI | `GEMINI_CHAT_API_KEY` | Chatbot / counseling |
| Career Recommendation | `GEMINI_RECOMMEND_API_KEY` | Career recommendations |
| Career Comparison | `GEMINI_COMPARE_API_KEY` | Compare careers |
| Resume Analyzer | `GEMINI_RESUME_API_KEY` | Resume analysis |
| Internship | `GEMINI_INTERNSHIP_API_KEY` | Internship suggestions |
| Project | `GEMINI_PROJECT_API_KEY` | Project ideas |
| Analytics | `GEMINI_ANALYTICS_API_KEY` | Analytics insights |
| Roadmap | `GEMINI_ROADMAP_API_KEY` | Roadmaps & skill gap |

Shared settings: `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS`, `GEMINI_REQUEST_TIMEOUT_MS`

## Setup

```bash
npm run install:all
cp .env.example server/.env
# Fill in all GEMINI_*_API_KEY values
npm run dev
```

## AI Self-Test

```bash
cd server && npm run ai:test
```
