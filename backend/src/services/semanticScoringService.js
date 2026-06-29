import { SemanticMatcherService } from "./ai/semanticMatcherService.js";
import { RankingEngineService } from "./ai/rankingEngineService.js";

const semanticMatcher = new SemanticMatcherService();
const rankingEngine = new RankingEngineService();

export const scoreCandidate = async (candidate, job, jobAnalysis) => {
  if (!candidate || !job || !jobAnalysis) {
    throw new Error("Candidate, Job, and JobAnalysis are all required for scoring.");
  }

  // 1. Generate structured candidate embedding locally
  let candidateEmbedding = candidate.embedding;
  if (!candidateEmbedding || candidateEmbedding.length === 0) {
    const requiredSkillNames = (jobAnalysis.extractedSkills || []).map(s => s.skill || s).join(", ");
    const candidateText = `Candidate Role: ${candidate.title} | Company: ${candidate.company} | Experience: ${candidate.experienceYears} years | Skills: ${candidate.skills?.join(", ") || "None"} | Domain: ${candidate.experienceSummary?.slice(0, 100) || ""}`;
    candidateEmbedding = await semanticMatcher.generateEmbedding(candidateText);
    candidate.embedding = candidateEmbedding;
  }

  // 2. Calculate Cosine Similarity against the job analysis embedding
  const baseSimilarity = semanticMatcher.calculateCosineSimilarity(candidateEmbedding, jobAnalysis.embedding);

  // 3. Generate detailed scorecard from real candidate + job data
  const scoring = rankingEngine.calculateCandidateScore(candidate, jobAnalysis, baseSimilarity);

  // 4. Generate AI summary string
  const requiredSkills = (jobAnalysis.extractedSkills || []).map(s => s.skill || s);
  const candidateSkills = candidate.skills || [];
  const missingSkills = requiredSkills.filter(s => !candidateSkills.some(c => c.toLowerCase().includes(s.toLowerCase())));
  const summary = `${candidate.name} has ${candidate.experienceYears || "unknown"} years of experience as ${candidate.title}. Semantic similarity score: ${Math.round(baseSimilarity * 100)}%. ${missingSkills.length > 0 ? `Missing skills: ${missingSkills.join(", ")}.` : "All required skills matched."} AI Recommendation: ${scoring.aiRecommendation}.`;

  return {
    matchScore: scoring.matchScore,
    scoreBreakdown: scoring.scoreBreakdown,
    redFlags: scoring.redFlags,
    strengths: scoring.strengths,
    aiRecommendation: scoring.aiRecommendation,
    summary,
    embedding: candidateEmbedding,
  };
};
