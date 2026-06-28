import axios from "axios";
import { calculateCosineSimilarity, getEmbedding } from "./embeddingService.js";

/**
 * Scores a candidate against a job analysis.
 * Uses embedding cosine similarity for the overall match, and Qwen 2.5 for detailed analysis and red flags.
 */
export const scoreCandidate = async (candidate, job, jobAnalysis) => {
  if (!candidate || !job || !jobAnalysis) {
    throw new Error("Candidate, Job, and JobAnalysis are all required for scoring.");
  }

  // 1. Calculate overall semantic score via BGE embeddings
  let candidateEmbedding = candidate.embedding;
  if (!candidateEmbedding || candidateEmbedding.length === 0) {
    const candidateText = `${candidate.title} ${candidate.company} ${candidate.skills?.join(", ") || ""} ${candidate.experienceSummary || ""}`;
    candidateEmbedding = await getEmbedding(candidateText);
    candidate.embedding = candidateEmbedding; // cache it
  }

  const baseSimilarity = calculateCosineSimilarity(candidateEmbedding, jobAnalysis.embedding);
  // Scale cosine similarity from [-1, 1] or [0, 1] to [0, 100]
  const matchScore = Math.round(Math.max(0, baseSimilarity) * 100);

  // 2. Perform detailed analysis & red-flag detection using Qwen 2.5
  let analysisResult = null;
  try {
    const hfToken = process.env.HF_TOKEN;
    const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};

    const prompt = `You are an expert recruiter AI. Score the candidate against the job description and detect any red flags.
Your response MUST be a valid JSON object ONLY. Do not include any markdown formatting, backticks, or introduction text.

Job Description:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.requiredSkills?.join(", ") || "None listed"}
Experience Requirement: ${job.experience}
Description: ${job.description}

Candidate Profile:
Name: ${candidate.name}
Stated Title: ${candidate.title}
Company: ${candidate.company}
Skills: ${candidate.skills?.join(", ") || "None listed"}
Experience Summary: ${candidate.experienceSummary || "None"}
Experience Years: ${candidate.experienceYears || "Not specified"}

Red Flag Criteria:
- Very frequent job changes (more than 3 jobs in 2 years without an obvious contracting pattern)
- Title inflation (e.g., claiming a Director/VP title at a tiny <5 person company, which is not equivalent to a larger company)
- Skill inconsistency (skills listed in the profile that are inconsistent with their stated experience level or history)

JSON Schema:
{
  "scoreBreakdown": {
    "technicalSkills": 0-100,
    "seniorityIndicators": 0-100,
    "domainExperience": 0-100
  },
  "flags": ["Describe red flags found, or leave empty if none"],
  "summary": "A 2-3 sentence explanation of the match."
}`;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
      { inputs: prompt, parameters: { max_new_tokens: 500, return_full_text: false } },
      { headers, timeout: 15000 }
    );

    let textResponse = "";
    if (Array.isArray(response.data)) {
      textResponse = response.data[0]?.generated_text || "";
    } else if (response.data?.generated_text) {
      textResponse = response.data.generated_text;
    }

    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    analysisResult = JSON.parse(textResponse);

  } catch (error) {
    console.warn("⚠️ Qwen 2.5 Candidate Scoring API failed, using rule-based fallback:", error.message);
    analysisResult = runRuleBasedScoring(candidate, job, jobAnalysis);
  }

  return {
    matchScore,
    scoreBreakdown: {
      technicalSkills: Math.round(analysisResult.scoreBreakdown?.technicalSkills ?? matchScore),
      seniorityIndicators: Math.round(analysisResult.scoreBreakdown?.seniorityIndicators ?? matchScore),
      domainExperience: Math.round(analysisResult.scoreBreakdown?.domainExperience ?? matchScore),
    },
    flags: analysisResult.flags || [],
    summary: analysisResult.summary || "Candidate evaluated based on skills and profile details.",
    embedding: candidateEmbedding,
  };
};

/**
 * Rule-based fallback scoring and red-flag detection
 */
function runRuleBasedScoring(candidate, job, jobAnalysis) {
  const skills = candidate.skills || [];
  const requiredSkills = jobAnalysis.extractedSkills.map(s => s.skill.toLowerCase());
  const preferredSkills = jobAnalysis.preferredSkills.map(s => s.skill.toLowerCase());

  // 1. Technical Skills Score
  let techMatchCount = 0;
  skills.forEach(skill => {
    if (requiredSkills.includes(skill.toLowerCase()) || preferredSkills.includes(skill.toLowerCase())) {
      techMatchCount++;
    }
  });
  const totalSkillsExpected = Math.max(1, requiredSkills.length + preferredSkills.length);
  const technicalSkills = Math.min(100, Math.round((techMatchCount / totalSkillsExpected) * 100 + 30));

  // 2. Seniority Indicators Score
  let seniorityIndicators = 70;
  const candidateTitleLower = candidate.title?.toLowerCase() || "";
  const jdSeniorityLower = jobAnalysis.seniority?.level?.toLowerCase() || "";

  if (jdSeniorityLower.includes("senior") || jdSeniorityLower.includes("lead")) {
    if (candidateTitleLower.includes("senior") || candidateTitleLower.includes("lead") || candidateTitleLower.includes("architect") || candidateTitleLower.includes("principal")) {
      seniorityIndicators = 95;
    } else {
      seniorityIndicators = 50; // Underqualified title
    }
  } else if (jdSeniorityLower.includes("junior")) {
    if (candidateTitleLower.includes("junior") || candidateTitleLower.includes("intern") || candidateTitleLower.includes("associate")) {
      seniorityIndicators = 90;
    } else {
      seniorityIndicators = 60; // Overqualified title
    }
  }

  // 3. Domain Experience Score
  let domainExperience = 75;
  const candidateExpYears = candidate.experienceYears || 2;
  const minExpRequired = jobAnalysis.experienceRange?.min || 2;
  const maxExpRequired = jobAnalysis.experienceRange?.max || 5;

  if (candidateExpYears >= minExpRequired && candidateExpYears <= maxExpRequired) {
    domainExperience = 95;
  } else if (candidateExpYears > maxExpRequired) {
    domainExperience = 85; // slightly over-experienced
  } else {
    const diff = minExpRequired - candidateExpYears;
    domainExperience = Math.max(30, 90 - (diff * 20)); // under-experienced
  }

  // 4. Red-flag detection
  const flags = [];
  const summaryText = candidate.experienceSummary?.toLowerCase() || "";

  // A. Job hopping detection (frequent job changes in summary)
  if (
    summaryText.includes("contractor") === false && 
    summaryText.includes("contract") === false && 
    (summaryText.match(/short stint/g) || []).length > 1
  ) {
    flags.push("Frequent job changes detected (potential high turnover risk).");
  }

  // B. Title inflation
  if (
    (candidateTitleLower.includes("director") || candidateTitleLower.includes("vp") || candidateTitleLower.includes("cto") || candidateTitleLower.includes("ceo")) &&
    (candidate.company?.toLowerCase().includes("self") || candidate.company?.toLowerCase().includes("freelance") || candidate.company?.length < 3)
  ) {
    flags.push("Potential title inflation: C-level/Director title at a freelance or micro-organization.");
  }

  // C. Skill inconsistency
  if (candidateExpYears < 2 && (skills.includes("System Design") || skills.includes("Architect") || skills.includes("Kubernetes"))) {
    flags.push("Skill inconsistency: Advanced skills listed (e.g. System Design/Kubernetes) for a junior candidate with under 2 years of experience.");
  }

  // Generate summary
  const summary = `${candidate.name} is a ${candidate.title} with ${candidateExpYears} years of experience. They possess key skills in ${skills.slice(0, 3).join(", ")}.`;

  return {
    scoreBreakdown: {
      technicalSkills,
      seniorityIndicators,
      domainExperience
    },
    flags,
    summary
  };
}
