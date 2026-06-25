# AI-Based Career Guidance Platform

A production-level career guidance platform for students with AI-powered recommendations, resume analysis, skill gap analysis, and a career chatbot.

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, Axios, React Router, Chart.js
- **Backend:** Node.js, Express.js, JWT, REST API
- **Database:** MongoDB with Mongoose
- **AI:** OpenAI API (chatbot, career explanations, resume suggestions)
- **Auth:** Google OAuth + JWT

## Features

- User authentication (signup, login, Google OAuth)
- User profile with skills, interests, resume upload
- AI career recommendations based on skills/interests
- Personalized learning roadmaps
- AI resume analyzer with score and suggestions
- Skill gap analysis
- AI career chatbot
- Internship/job recommendations
- Career comparison tool
- Project recommendations
- Admin panel
- Data analytics dashboard

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud Console project (for OAuth)
- OpenAI API key

### Installation

```bash
npm run install:all
```

### Environment Variables

Copy `.env.example` to `.env` in the project root and in `server/`:

```bash
cp .env.example .env
cp .env.example server/.env
```

Fill in:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Random secret for JWT
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `OPENAI_API_KEY` - From OpenAI

### Run Development

```bash
# Run both client and server
npm run dev

# Or separately:
npm run server   # Backend on http://localhost:5000
npm run client   # Frontend on http://localhost:5173
```

### Default Admin

After first run, create an admin user via register and set `role: 'admin'` in MongoDB, or use the seed script.

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| POST | /api/auth/google | Google OAuth |
| GET | /api/profile | Get profile (protected) |
| PUT | /api/profile/update | Update profile (protected) |
| GET | /api/careers/recommend | Get career recommendations |
| GET | /api/roadmap/:career | Get roadmap for career |
| POST | /api/resume/upload | Upload resume |
| GET | /api/resume/analyze | Get resume analysis |
| GET | /api/skills/gap/:career | Skill gap for career |
| POST | /api/chatbot | AI chatbot message |
| GET | /api/jobs/:career | Jobs for career |
| GET | /api/careers/compare | Compare careers |
| GET | /api/projects/:career | Projects for career |
| GET | /api/analytics/* | Analytics (admin) |
| * | /api/admin/* | Admin routes |

## Project Structure

```
/client          - React frontend
/server          - Express backend
  /src
    /controllers
    /routes
    /models
    /middleware
    /services
```

## License

MIT
