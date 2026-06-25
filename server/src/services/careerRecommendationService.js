import Career from '../models/Career.js';
import { getCareerExplanation } from './openaiService.js';

function normalize(str) {
  return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function similarity(userSkills = [], requiredSkills = []) {
  if (requiredSkills.length === 0) return 100;
  const userSet = new Set(userSkills.map(normalize));
  const requiredSet = new Set(requiredSkills.map(normalize));
  let match = 0;
  requiredSet.forEach((s) => {
    if (userSet.has(s)) match++;
    else {
      for (const u of userSet) {
        if (u.includes(s) || s.includes(u)) {
          match += 0.7;
          break;
        }
      }
    }
  });
  return Math.round((match / requiredSet.size) * 100);
}

export async function getRecommendations(user, limit = 5, useAI = true) {
  const careers = await Career.find({ isActive: true }).lean();
  const userSkills = user.skills || [];
  const userInterests = (user.interests || []).map(normalize);
  const scored = careers.map((c) => {
    const required = c.required_skills || [];
    const matchPercent = similarity(userSkills, required);
    let bonus = 0;
    const nameNorm = normalize(c.career_name);
    if (userInterests.some((i) => nameNorm.includes(i) || i.includes(nameNorm))) bonus += 10;
    const score = Math.min(100, matchPercent + bonus);
    return { ...c, matchPercent: score, matchPercentRaw: matchPercent };
  });
  scored.sort((a, b) => b.matchPercent - a.matchPercent);
  const top = scored.slice(0, limit);
  if (useAI) {
    const withExplanations = await Promise.all(
      top.map(async (c) => ({
        ...c,
        aiExplanation: await getCareerExplanation(c.career_name, userSkills, c.matchPercent),
      }))
    );
    return withExplanations;
  }
  return top;
}
