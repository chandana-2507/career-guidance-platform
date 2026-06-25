import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { validateGeminiConfig, probeGeminiConnection } from './config/geminiConfig.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import skillGapRoutes from './routes/skillGapRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/skills', skillGapRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(async () => {
    const geminiConfig = validateGeminiConfig();
    geminiConfig.errors.forEach((message) => console.error(`[CareerPilot AI] ${message}`));
    geminiConfig.warnings.forEach((message) => console.warn(`[CareerPilot AI] ${message}`));

    if (geminiConfig.ok && process.env.GEMINI_STARTUP_PROBE !== 'false') {
      const probe = await probeGeminiConnection();
      if (probe.ok) {
        console.log(`[CareerPilot AI] Ready (verified with ${probe.model})`);
      } else {
        probe.errors?.forEach((message) => console.warn(`[CareerPilot AI] ${message}`));
      }
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
