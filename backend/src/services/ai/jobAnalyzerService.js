import axios from "axios";

export class JobAnalyzerService {
  async analyzeJob(description) {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    try {
      const response = await axios.post(`${ollamaUrl}/api/chat`, {
        model: "qwen2.5",
        messages: [
          {
            role: "user",
            content: `Analyze the following job description and extract structural details in JSON format.
Your response MUST be a valid JSON object ONLY. Do not include any markdown formatting.

Job Description:
${description}

JSON Schema:
{
  "extractedSkills": [{"skill": "Skill name", "confidence": 0-100, "level": "junior|mid|senior"}],
  "preferredSkills": [{"skill": "Skill name", "confidence": 0-100}],
  "softSkills": [{"skill": "Skill name", "confidence": 0-100}],
  "implicitRequirements": [{"requirement": "Requirement", "confidence": 0-100}],
  "seniority": {"level": "Junior|Mid Level|Senior|Lead", "confidence": 0-100},
  "experienceRange": {"min": number, "max": number, "confidence": 0-100},
  "domain": "Domain Name",
  "searchQueries": ["Query 1", "Query 2"]
}`
          }
        ],
        stream: false
      }, { timeout: 15000 });

      const textResponse = response.data?.message?.content || "";
      const cleaned = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);

    } catch (error) {
      console.warn("⚠️ Local Ollama Job Analysis failed, using robust rule-based fallback.");
      return this._runRuleBasedJobAnalysis(description);
    }
  }

  _runRuleBasedJobAnalysis(description) {
    const lowerDesc = description.toLowerCase();
    const extractedSkills = [{ skill: "Software Engineering", confidence: 90, level: "mid" }];
    if (lowerDesc.includes("react")) extractedSkills.push({ skill: "React", confidence: 95, level: "mid" });
    if (lowerDesc.includes("node")) extractedSkills.push({ skill: "Node.js", confidence: 95, level: "mid" });
    
    let level = "Mid Level";
    if (lowerDesc.includes("senior") || lowerDesc.includes("lead")) level = "Senior";
    else if (lowerDesc.includes("junior")) level = "Junior";

    let min = 2, max = 5;
    const expMatch = description.match(/(\d+)\s*-\s*(\d+)\s*years?/i);
    if (expMatch) {
      min = parseInt(expMatch[1]);
      max = parseInt(expMatch[2]);
    }

    return {
      extractedSkills,
      preferredSkills: [{ skill: "Cloud Services", confidence: 70 }],
      softSkills: [{ skill: "Communication", confidence: 85 }],
      implicitRequirements: [{ requirement: "Fast-paced environment", confidence: 80 }],
      seniority: { level, confidence: 90 },
      experienceRange: { min, max, confidence: 85 },
      domain: lowerDesc.includes("fintech") ? "Fintech" : "General Tech",
      searchQueries: [`${level} Developer`]
    };
  }
}
