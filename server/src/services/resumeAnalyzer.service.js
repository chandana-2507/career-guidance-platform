import { createGeminiAgent } from './geminiWrapper.js';

const gemini = createGeminiAgent('resume');
import { buildStudentContextPrompt } from './profileContext.js';

export async function analyzeResumeWithAi({ resumeText, user }) {
  if (!resumeText || resumeText.trim().length < 50) {
    const error = new Error('Resume text is too short to analyze');
    error.statusCode = 400;
    throw error;
  }

  const profileContext = {
    name: user?.name,
    skills: user?.skills || [],
    interests: user?.interests || [],
    careerGoals: user?.careerGoals || user?.careerGoal || '',
    degree: user?.degree || '',
    branch: user?.branch || '',
  };

  const prompt = `You are Resume Analyzer AI. Analyze this resume thoroughly.

Student context:
${JSON.stringify(profileContext, null, 2)}

Resume text:
"""
${resumeText.slice(0, 12000)}
"""

Return valid JSON only:
{
  "overallScore": 75,
  "atsScore": 70,
  "summary": "2-3 sentence assessment",
  "strengths": ["strength"],
  "weaknesses": ["weakness"],
  "missingSkills": ["skill"],
  "formattingIssues": ["issue"],
  "grammarSuggestions": ["fix"],
  "keywordAnalysis": ["keyword present or missing"],
  "careerSuggestions": ["career path"],
  "careerFit": "Best career fit summary",
  "missingCertifications": ["cert"],
  "missingProjects": ["project type"],
  "interviewReadiness": "Assessment of interview readiness",
  "improvementSuggestions": ["actionable suggestion"],
  "recommendedCertifications": ["cert"],
  "suggestedProjects": ["project"],
  "improvedSummary": "Rewritten professional summary"
}

Rules:
- overallScore and atsScore must be 0-100 integers.
- Base feedback on actual resume content only.`;

  const parsed = await gemini.generateJsonWithFallback({
    prompt,
    contextLabel: 'resume analyzer',
    maxOutputTokens: 3500,
    dedupeKey: `resume:${resumeText.slice(0, 128).length}:${resumeText.length}`,
  });

  return {
    overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 0)),
    atsScore: Math.min(100, Math.max(0, Number(parsed.atsScore) || 0)),
    summary: String(parsed.summary || '').trim(),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.map(String) : [],
    formattingIssues: Array.isArray(parsed.formattingIssues)
      ? parsed.formattingIssues.map(String)
      : [],
    grammarSuggestions: Array.isArray(parsed.grammarSuggestions)
      ? parsed.grammarSuggestions.map(String)
      : [],
    keywordAnalysis: Array.isArray(parsed.keywordAnalysis)
      ? parsed.keywordAnalysis.map(String)
      : [],
    careerSuggestions: Array.isArray(parsed.careerSuggestions)
      ? parsed.careerSuggestions.map(String)
      : [],
    careerFit: String(parsed.careerFit || '').trim(),
    missingCertifications: Array.isArray(parsed.missingCertifications)
      ? parsed.missingCertifications.map(String)
      : [],
    missingProjects: Array.isArray(parsed.missingProjects)
      ? parsed.missingProjects.map(String)
      : [],
    interviewReadiness: String(parsed.interviewReadiness || '').trim(),
    improvementSuggestions: Array.isArray(parsed.improvementSuggestions)
      ? parsed.improvementSuggestions.map(String)
      : [],
    recommendedCertifications: Array.isArray(parsed.recommendedCertifications)
      ? parsed.recommendedCertifications.map(String)
      : [],
    suggestedProjects: Array.isArray(parsed.suggestedProjects)
      ? parsed.suggestedProjects.map(String)
      : [],
    improvedSummary: String(parsed.improvedSummary || '').trim(),
  };
}
