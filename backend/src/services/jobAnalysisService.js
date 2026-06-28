import axios from "axios";
import { getEmbedding } from "./embeddingService.js";

/**
 * Analyzes a job description using Qwen 2.5 Instruct to extract key details.
 * Falls back to a rule-based parser if the API fails.
 */
const analyzeJob = async (description) => {
  if (!description) {
    throw new Error("Job description is required for analysis.");
  }

  let result = null;

  // Try Qwen 2.5 Instruct via Hugging Face
  try {
    const hfToken = process.env.HF_TOKEN;
    const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};

    const prompt = `You are an expert recruiter AI. Analyze the following job description and extract structural details in JSON format.
Your response MUST be a valid JSON object ONLY. Do not include any markdown formatting, backticks, or introduction text.

Job Description:
"""
${description}
"""

JSON Schema:
{
  "extractedSkills": [{"skill": "Skill name", "confidence": 0-100, "level": "junior|mid|senior"}],
  "preferredSkills": [{"skill": "Skill name", "confidence": 0-100}],
  "softSkills": [{"skill": "Skill name", "confidence": 0-100}],
  "implicitRequirements": [{"requirement": "Requirement", "confidence": 0-100}],
  "seniority": {"level": "Junior|Mid Level|Senior|Lead", "confidence": 0-100},
  "experienceRange": {"min": number, "max": number, "confidence": 0-100},
  "searchQueries": ["Query 1", "Query 2"]
}`;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
      { inputs: prompt, parameters: { max_new_tokens: 1000, return_full_text: false } },
      { headers, timeout: 15000 }
    );

    let textResponse = "";
    if (Array.isArray(response.data)) {
      textResponse = response.data[0]?.generated_text || "";
    } else if (response.data?.generated_text) {
      textResponse = response.data.generated_text;
    }

    // Clean up response text if it contains markdown code blocks
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    result = JSON.parse(textResponse);

  } catch (error) {
    console.warn("⚠️ Qwen 2.5 Job Analysis API failed, using rule-based fallback:", error.message);
    result = runRuleBasedJobAnalysis(description);
  }

  // Generate embedding for the job analysis representation
  const analysisText = `${result.seniority.level} ${result.extractedSkills.map(s => s.skill).join(", ")} ${result.implicitRequirements.map(r => r.requirement).join(", ")}`;
  const embedding = await getEmbedding(analysisText);

  return {
    ...result,
    embedding,
  };
};

/**
 * Rule-based fallback job analysis
 */
function runRuleBasedJobAnalysis(description) {
  const lowerDesc = description.toLowerCase();
  
  // Match skills
  const skillsList = [
    { name: "React", keywords: ["react", "react.js", "reactjs"] },
    { name: "Node.js", keywords: ["node", "node.js", "nodejs"] },
    { name: "Go", keywords: ["go ", "golang", "go,"] },
    { name: "Python", keywords: ["python", "django", "flask"] },
    { name: "TypeScript", keywords: ["typescript", "ts"] },
    { name: "Kubernetes", keywords: ["kubernetes", "k8s"] },
    { name: "Docker", keywords: ["docker", "container"] },
    { name: "AWS", keywords: ["aws", "amazon web services"] },
    { name: "MongoDB", keywords: ["mongodb", "mongo"] },
    { name: "PostgreSQL", keywords: ["postgres", "postgresql"] },
    { name: "System Design", keywords: ["system design", "scalable architecture"] }
  ];

  const extractedSkills = [];
  const preferredSkills = [];

  skillsList.forEach((skill) => {
    const matches = skill.keywords.some(kw => lowerDesc.includes(kw));
    if (matches) {
      // Arbitrary heuristic: if mentioned early or multiple times, make it required
      const count = (lowerDesc.match(new RegExp(skill.keywords[0], "g")) || []).length;
      if (count > 1) {
        extractedSkills.push({ skill: skill.name, confidence: 90, level: "mid" });
      } else {
        preferredSkills.push({ skill: skill.name, confidence: 80 });
      }
    }
  });

  // Simple seniority detection
  let level = "Mid Level";
  if (lowerDesc.includes("senior") || lowerDesc.includes("lead") || lowerDesc.includes("architect")) {
    level = "Senior";
  } else if (lowerDesc.includes("junior") || lowerDesc.includes("entry") || lowerDesc.includes("intern")) {
    level = "Junior";
  }

  // Simple experience range detection
  let min = 2;
  let max = 5;
  const expMatch = description.match(/(\d+)\s*-\s*(\d+)\s*years?/i) || description.match(/(\d+)\s*\+\s*years?/i);
  if (expMatch) {
    min = parseInt(expMatch[1]);
    max = expMatch[2] ? parseInt(expMatch[2]) : min + 3;
  }

  // Soft skills
  const softSkills = [];
  if (lowerDesc.includes("communicat")) softSkills.push({ skill: "Communication", confidence: 95 });
  if (lowerDesc.includes("mentor") || lowerDesc.includes("lead")) softSkills.push({ skill: "Mentorship", confidence: 85 });
  if (lowerDesc.includes("collaborat") || lowerDesc.includes("team")) softSkills.push({ skill: "Collaboration", confidence: 90 });

  // Implicit requirements
  const implicitRequirements = [];
  if (lowerDesc.includes("fast-paced") || lowerDesc.includes("startup") || lowerDesc.includes("agile")) {
    implicitRequirements.push({ requirement: "Startup/Fast-paced adaptability", confidence: 80 });
  }
  if (lowerDesc.includes("stakeholder") || lowerDesc.includes("client") || lowerDesc.includes("product manager")) {
    implicitRequirements.push({ requirement: "Stakeholder Management", confidence: 75 });
  }

  // Generate queries
  const searchQueries = [
    `${level} Developer`,
    `${extractedSkills.map(s => s.skill).slice(0, 2).join(" ")} Developer`
  ];

  return {
    extractedSkills: extractedSkills.length ? extractedSkills : [{ skill: "Software Engineering", confidence: 80, level: "mid" }],
    preferredSkills: preferredSkills.length ? preferredSkills : [{ skill: "Cloud Services", confidence: 70 }],
    softSkills: softSkills.length ? softSkills : [{ skill: "Problem Solving", confidence: 90 }],
    implicitRequirements: implicitRequirements.length ? implicitRequirements : [{ requirement: "Self-starter", confidence: 80 }],
    seniority: { level, confidence: 90 },
    experienceRange: { min, max, confidence: 85 },
    searchQueries,
  };
}

export default analyzeJob;
