import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const getOpenAIClient = () => openai;

export async function getCareerExplanation(careerName, userSkills = [], matchPercent = 0) {
  if (!openai) return null;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a career advisor. Give a brief, encouraging 2-3 sentence explanation for why this career might suit the user.',
        },
        {
          role: 'user',
          content: `Career: ${careerName}. User has skills: ${userSkills.join(', ') || 'none listed'}. Match: ${matchPercent}%. Explain why this career could be a good fit.`,
        },
      ],
      max_tokens: 150,
    });
    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('OpenAI career explanation error:', e.message);
    return null;
  }
}

export async function getResumeSuggestions(extractedText, targetRole = 'general') {
  if (!openai) return [];
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a resume expert. Return only a JSON array of 3-5 short improvement suggestions (strings), no other text.',
        },
        {
          role: 'user',
          content: `Resume content (summary): ${extractedText?.slice(0, 2000) || 'N/A'}. Target role: ${targetRole}. Give improvement suggestions.`,
        },
      ],
      max_tokens: 300,
    });
    const text = completion.choices[0]?.message?.content?.trim() || '[]';
    try {
      return JSON.parse(text);
    } catch {
      return text.split('\n').filter(Boolean).slice(0, 5);
    }
  } catch (e) {
    console.error('OpenAI resume suggestions error:', e.message);
    return [];
  }
}

export async function getChatbotResponse(userMessage, context = {}) {
  if (!openai) {
    return 'AI is not configured. Please set OPENAI_API_KEY.';
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a friendly career mentor chatbot. Answer career-related questions about skills, job preparation, interviews, and career paths. Be concise and helpful. User context: ${JSON.stringify(context)}`,
        },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
    });
    return completion.choices[0]?.message?.content?.trim() || 'I could not generate a response.';
  } catch (e) {
    console.error('OpenAI chatbot error:', e.message);
    return 'Sorry, I encountered an error. Please try again.';
  }
}
