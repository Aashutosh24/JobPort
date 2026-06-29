import { AIProvider } from "./provider.js";
import { pipeline } from "@xenova/transformers";
import axios from "axios";
import fs from "fs";

// Lazy-loaded embedding pipeline
let embedder = null;
const getEmbedder = async () => {
  if (!embedder) {
    console.log("📦 Loading local BGE embedding model (Xenova/bge-small-en-v1.5)...");
    embedder = await pipeline("feature-extraction", "Xenova/bge-small-en-v1.5");
  }
  return embedder;
};

export class LocalAIProvider extends AIProvider {
  /**
   * Generates BGE embeddings (384 dimensions) locally using ONNX Runtime
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== "string") {
      return new Array(384).fill(0);
    }

    try {
      const embed = await getEmbedder();
      const output = await embed(text.trim(), { pooling: "mean", normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.warn("⚠️ Local ONNX embedding failed, using deterministic fallback:", error.message);
      return this._generateDeterministicVector(text);
    }
  }

  /**
   * Analyzes job description using local Ollama (Qwen 2.5) or rule-based fallback
   */
  async analyzeJob(description, context = {}) {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const explicitRange = this._parseExperienceRange(context.explicitExperience);
    
    try {
      const response = await axios.post(`${ollamaUrl}/api/chat`, {
        model: "qwen2.5",
        messages: [
          {
            role: "user",
            content: `Analyze the following job description and extract structural details in JSON format.
Your response MUST be a valid JSON object ONLY. Do not include markdown, backticks, explanations, or extra text.
Only extract skills and requirements that are explicitly stated in the job description or the recruiter-provided experience field.
Do NOT infer or add AI/ML, machine learning, TypeScript, AWS, Docker, or any other skill unless it is explicitly present.

Job Description:
${description}
${context.explicitExperience ? `\nNote: The recruiter explicitly specified "${context.explicitExperience}" experience required. Use this exact range.` : ""}

JSON Schema:
{
  "extractedSkills": [{"skill": "Skill name", "confidence": 0-100, "level": "junior|mid|senior"}],
  "preferredSkills": [{"skill": "Skill name", "confidence": 0-100}],
  "softSkills": [{"skill": "Skill name", "confidence": 0-100}],
  "implicitRequirements": [{"requirement": "Requirement", "confidence": 0-100}],
  "seniority": {"level": "Junior|Mid Level|Senior|Lead", "confidence": 0-100},
  "experienceRange": {"min": number, "max": number, "confidence": 0-100},
  "domain": "Fintech|EdTech|E-commerce|AI/ML|Healthcare|General Tech",
  "searchQueries": ["Query 1", "Query 2"]
}`
          }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0,
          top_p: 0.9,
          num_predict: 1024,
        }
      }, { timeout: 60000 });

      const textResponse = response.data?.message?.content || response.data?.response || "";
      const result = this._parseJsonResponse(textResponse);

      // Override experienceRange with the explicit value from the form (authoritative source)
      if (explicitRange) {
        result.experienceRange = { ...explicitRange, confidence: 100 };
      }

      // Generate structured embedding for the job analysis representation
      const skillsStr = result.extractedSkills.map(s => `${s.skill} (${s.level || 'mid'})`).join(", ");
      const prefSkillsStr = result.preferredSkills?.map(s => s.skill).join(", ") || "None";
      const implicitStr = result.implicitRequirements?.map(r => r.requirement).join(", ") || "None";
      
      const analysisText = `Required Role: ${result.seniority.level} | Skills: ${skillsStr} | Preferred: ${prefSkillsStr} | Experience: ${result.experienceRange.min}-${result.experienceRange.max} years | Domain: ${result.domain || 'General Tech'} | Implicit: ${implicitStr}`;
      const embedding = await this.generateEmbedding(analysisText);

      return { ...result, embedding };

    } catch (error) {
      console.warn("⚠️ Local Ollama Job Analysis failed (is Ollama running with qwen2.5?), using rule-based fallback.");
      const result = this._runRuleBasedJobAnalysis(description, context);
      // Override experienceRange with explicit value
      if (explicitRange) {
        result.experienceRange = { ...explicitRange, confidence: 100 };
      }
      const skillsStr = result.extractedSkills.map(s => `${s.skill} (${s.level || 'mid'})`).join(", ");
      const prefSkillsStr = result.preferredSkills?.map(s => s.skill).join(", ") || "None";
      const implicitStr = result.implicitRequirements?.map(r => r.requirement).join(", ") || "None";
      
      const analysisText = `Required Role: ${result.seniority.level} | Skills: ${skillsStr} | Preferred: ${prefSkillsStr} | Experience: ${result.experienceRange.min}-${result.experienceRange.max} years | Domain: ${result.domain || 'General Tech'} | Implicit: ${implicitStr}`;
      const embedding = await this.generateEmbedding(analysisText);
      return { ...result, embedding };
    }
  }

  /**
   * Generates candidate-specific questions using local Ollama or rule-based fallback
   */
  async generateQuestions(candidate, job) {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

    try {
      const response = await axios.post(`${ollamaUrl}/api/chat`, {
        model: "qwen2.5",
        messages: [
          {
            role: "user",
            content: `Generate exactly 3 customized interview questions for this candidate based on the job description and candidate profile.
Your response MUST be a valid JSON array of objects ONLY. Do not include any markdown formatting, backticks, or introduction text.

Job: ${job.title} at ${job.company}
Candidate: ${candidate.name} (${candidate.title})
Skills: ${candidate.skills?.join(", ")}
Summary: ${candidate.experienceSummary}

JSON Schema:
[
  {
    "question": "Question text here",
    "type": "technical|behavioral|situational",
    "thinkTime": 30,
    "maxTime": 180
  }
]`
          }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0,
          top_p: 0.9,
          num_predict: 512,
        }
      }, { timeout: 60000 });

      const textResponse = response.data?.message?.content || response.data?.response || "";
      return this._parseJsonResponse(textResponse);

    } catch (error) {
      console.warn("⚠️ Local Ollama Question Gen failed, using rule-based fallback.");
      return this._generateFallbackQuestions(candidate, job);
    }
  }

  /**
   * Evaluates candidate responses using local Ollama or rule-based fallback
   */
  async evaluateInterview(candidate, job, questions, answers) {
    const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const formattedAnswers = answers.map((ans, idx) => `
Question ${idx + 1}: ${ans.question}
Answer: ${ans.transcription}
`).join("\n");

    try {
      const response = await axios.post(`${ollamaUrl}/api/chat`, {
        model: "qwen2.5",
        messages: [
          {
            role: "user",
            content: `Evaluate the candidate's interview transcript.
Your response MUST be a valid JSON object ONLY. Do not include any markdown formatting, backticks, or introduction text.

Job: ${job.title}
Candidate: ${candidate.name}

Transcript:
${formattedAnswers}

JSON Schema:
{
  "answers": [
    {
      "question": "Question text",
      "relevance": 0-100,
      "clarity": 0-100,
      "specificity": 0-100,
      "depth": 0-100,
      "summary": "2-3 sentence summary of the answer"
    }
  ],
  "scorecard": {
    "summary": "Overall assessment text",
    "verdict": "Highly Recommended|Recommended|Do Not Hire",
    "confidence": 0-100,
    "followUpQuestions": ["Question 1", "Question 2", "Question 3"]
  }
}`
          }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0,
          top_p: 0.9,
          num_predict: 1024,
        }
      }, { timeout: 60000 });

      const textResponse = response.data?.message?.content || response.data?.response || "";
      return this._parseJsonResponse(textResponse);

    } catch (error) {
      console.warn("⚠️ Local Ollama Evaluation failed, using rule-based fallback.");
      return this._runRuleBasedEvaluation(answers, job.title);
    }
  }

  /**
   * Whisper transcription (integrated with hosted fallback / mock transcription)
   */
  async transcribeAudio(audioPath) {
    // Attempt transcription via Whisper API (Hugging Face or self-hosted)
    try {
      const hfToken = process.env.HF_TOKEN;
      const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};
      
      const audioData = fs.readFileSync(audioPath);
      
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/openai/whisper-base.en",
        audioData,
        { headers, timeout: 30000 }
      );

      return response.data?.text || "";
    } catch (apiError) {
      console.warn("⚠️ Whisper API failed, using local mock transcription.");
      return this._generateMockTranscription(audioPath);
    }
  }

  // --- PRIVATE FALLBACK IMPLEMENTATIONS ---

  _generateDeterministicVector(text) {
    const vector = new Array(384).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = word.charCodeAt(i) + ((hash << 5) - hash);
      }
      for (let j = 0; j < 3; j++) {
        const index = Math.abs((hash + j * 101) % 384);
        vector[index] += Math.sin(hash + j) * 1.5;
      }
    });
    let magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return magnitude === 0 ? [1.0, ...new Array(383).fill(0)] : vector.map(v => v / magnitude);
  }

  _parseJsonResponse(textResponse) {
    const cleaned = (textResponse || "").replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sliced = cleaned.slice(firstBrace, lastBrace + 1);
        return JSON.parse(sliced);
      }
      throw new Error("Ollama returned non-JSON content");
    }
  }

  _runRuleBasedJobAnalysis(description, context = {}) {
    const lowerDesc = description.toLowerCase();
    const titleText = (context.title || "").toLowerCase();

    // Helper: test if any keyword matches as a WHOLE WORD in the text (no false positives)
    const hasWord = (text, keywords) =>
      keywords.some(kw => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text));

    // Count occurrences of keywords as whole words
    const countWords = (text, keywords) =>
      keywords.reduce((total, kw) => {
        const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        return total + (text.match(re) || []).length;
      }, 0);

    // Master skill list — ALL keywords are FULL WORDS, no ambiguous short patterns
    const skillsList = [
      { name: "JavaScript",      keywords: ["javascript", "js", "es6", "es2015", "ecmascript"] },
      { name: "TypeScript",      keywords: ["typescript"] },  // NOT "ts" — too ambiguous
      { name: "Python",          keywords: ["python", "django", "flask", "fastapi", "pandas", "numpy"] },
      { name: "Go",              keywords: ["golang"] },       // NOT "go" alone — too ambiguous
      { name: "Java",            keywords: ["java", "spring", "spring boot", "hibernate"] },
      { name: "PHP",             keywords: ["php", "laravel", "symfony", "wordpress"] },
      { name: "C++",             keywords: ["c\\+\\+", "cpp"] },
      { name: "C#",              keywords: ["c#", "dotnet", "\\.net", "asp\\.net"] },
      { name: "SQL",             keywords: ["sql", "mysql", "sqlite", "postgresql", "postgres", "t-sql"] },
      { name: "HTML/CSS",        keywords: ["html", "css", "html5", "css3", "sass", "scss"] },
      { name: "React",           keywords: ["react", "reactjs", "react\\.js", "next\\.js", "nextjs"] },
      { name: "Node.js",         keywords: ["node\\.js", "nodejs", "express", "expressjs"] },
      { name: "Angular",         keywords: ["angular", "angularjs"] },
      { name: "Vue.js",          keywords: ["vue", "vuejs", "vue\\.js", "nuxt"] },
      { name: "AWS",             keywords: ["aws", "amazon web services", "ec2", "lambda", "s3", "cloudformation", "eks"] },
      { name: "Docker",          keywords: ["docker", "dockerfile", "containers"] },
      { name: "Kubernetes",      keywords: ["kubernetes", "k8s", "helm"] },
      { name: "MongoDB",         keywords: ["mongodb", "mongoose"] },
      { name: "PostgreSQL",      keywords: ["postgresql", "postgres"] },
      { name: "Redis",           keywords: ["redis", "elasticache"] },
      { name: "GraphQL",         keywords: ["graphql"] },
      { name: "Machine Learning",keywords: ["machine learning"] },
      { name: "Deep Learning",   keywords: ["deep learning", "neural network", "cnn", "rnn", "lstm"] },
      { name: "LLM",             keywords: ["llm", "large language model", "gpt", "chatgpt", "openai", "hugging face"] },
      { name: "NLP",             keywords: ["nlp", "natural language processing"] },
      { name: "TensorFlow",      keywords: ["tensorflow", "keras"] },
      { name: "PyTorch",         keywords: ["pytorch"] },
      { name: "System Design",   keywords: ["system design", "scalable architecture", "distributed systems"] },
      { name: "Microservices",   keywords: ["microservices", "micro-services"] },
      { name: "CI/CD",           keywords: ["ci/cd", "github actions", "jenkins", "circleci", "gitlab ci"] },
      { name: "Linux",           keywords: ["linux", "unix", "bash", "shell scripting"] },
    ];

    const extractedSkills = [];
    const preferredSkills = [];

    skillsList.forEach((skill) => {
      // Primary text to check (description + title)
      const combined = `${lowerDesc} ${titleText}`;
      if (!hasWord(combined, skill.keywords)) return;  // not mentioned at all

      // Determine if it's "required" (mentioned multiple times or in requirement sentences)
      const count = countWords(combined, skill.keywords);
      const isInRequirements = /\b(must|required|need|strong knowledge|solid experience|expertise|proficient|hands-on)\b/i.test(
        description.split(/[.!\n]/).filter(s => hasWord(s.toLowerCase(), skill.keywords)).join(" ")
      );

      if (count >= 2 || isInRequirements) {
        extractedSkills.push({ skill: skill.name, confidence: 90, level: "mid" });
      } else {
        preferredSkills.push({ skill: skill.name, confidence: 75 });
      }
    });

    let level = "Mid Level";
    if (hasWord(lowerDesc, ["senior", "lead", "principal", "staff", "architect"])) level = "Senior";
    else if (hasWord(lowerDesc, ["junior", "entry level", "entry-level", "intern", "graduate", "fresher"])) level = "Junior";

    // Use explicit experience from context (the form field), then fallback to description scan
    const explicitRange = this._parseExperienceRange(context.explicitExperience);
    const descriptionRange = this._parseExperienceRange(description);
    const min = explicitRange?.min ?? descriptionRange?.min ?? 2;
    const max = explicitRange?.max ?? descriptionRange?.max ?? 4;

    const softSkills = [];
    if (hasWord(lowerDesc, ["communicat", "communication"])) softSkills.push({ skill: "Communication", confidence: 95 });
    if (hasWord(lowerDesc, ["mentor", "mentorship"])) softSkills.push({ skill: "Mentorship", confidence: 85 });
    if (hasWord(lowerDesc, ["team", "collaboration", "collaborative"])) softSkills.push({ skill: "Collaboration", confidence: 80 });
    if (hasWord(lowerDesc, ["leadership", "lead", "manage"])) softSkills.push({ skill: "Leadership", confidence: 80 });
    if (hasWord(lowerDesc, ["analytical", "problem solving", "problem-solving"])) softSkills.push({ skill: "Analytical Thinking", confidence: 85 });

    const implicitRequirements = [];
    if (hasWord(lowerDesc, ["fast-paced", "startup", "agile"])) implicitRequirements.push({ requirement: "Fast-paced/Agile environment", confidence: 80 });
    if (hasWord(lowerDesc, ["phd", "research", "publications"])) implicitRequirements.push({ requirement: "Research background", confidence: 85 });
    if (hasWord(lowerDesc, ["deadline", "delivery", "shipping"])) implicitRequirements.push({ requirement: "Strong delivery discipline", confidence: 80 });

    // Domain detection — only from unambiguous keywords
    let domain = "General Tech";
    if (hasWord(lowerDesc, ["fintech", "payment", "banking", "finance", "insurtech"])) domain = "Fintech";
    else if (hasWord(lowerDesc, ["healthcare", "medical", "hospital", "pharma", "clinical"])) domain = "Healthcare";
    else if (hasWord(lowerDesc, ["edtech", "e-learning", "elearning", "mooc", "lms"])) domain = "EdTech";
    else if (hasWord(lowerDesc, ["machine learning", "deep learning", "artificial intelligence", "generative ai"])) domain = "AI/ML";
    else if (hasWord(lowerDesc, ["ecommerce", "e-commerce", "marketplace", "retail"])) domain = "E-commerce";
    else if (hasWord(lowerDesc, ["saas", "b2b", "enterprise software", "platform"])) domain = "SaaS/Enterprise";

    // Only inject AI/ML based on job TITLE — never from description alone (too easy to false-positive)
    if (hasWord(titleText, ["ai", "machine learning", "ml engineer", "data scientist", "nlp"])) {
      if (!extractedSkills.some(s => s.skill === "Machine Learning")) {
        extractedSkills.unshift({ skill: "Machine Learning", confidence: 95, level: "mid" });
      }
      if (domain === "General Tech") domain = "AI/ML";
    }

    const finalExtracted = extractedSkills.length
      ? extractedSkills
      : [{ skill: "Software Engineering", confidence: 75, level: "mid" }];

    const searchBase = `${context.title || "Developer"} ${context.location || ""}`.trim();
    const skillSearch = `${finalExtracted[0]?.skill || "Software"} Developer ${context.location || ""}`.trim();

    return {
      extractedSkills: finalExtracted,
      preferredSkills,
      softSkills,
      implicitRequirements,
      seniority: { level, confidence: 90 },
      experienceRange: { min, max, confidence: 100 },
      domain,
      searchQueries: [searchBase, skillSearch],
    };
  }

  _parseExperienceRange(text) {
    if (!text || typeof text !== "string") {
      return null;
    }

    const normalized = text.toLowerCase().replace(/,/g, " ");
    const rangeMatch = normalized.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)\s*(?:\+)?\s*(?:years?|yrs?)?/i);
    if (rangeMatch) {
      return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
    }

    const plusMatch = normalized.match(/(\d+)\s*\+\s*(?:years?|yrs?)?/i);
    if (plusMatch) {
      const min = parseInt(plusMatch[1], 10);
      return { min, max: min + 3 };
    }

    const singleMatch = normalized.match(/(\d+)\s*(?:years?|yrs?)?/i);
    if (singleMatch) {
      const min = parseInt(singleMatch[1], 10);
      return { min, max: min + 1 };
    }

    return null;
  }

  _generateFallbackQuestions(candidate, job) {
    const primarySkill = candidate.skills?.[0] || "Software Engineering";
    const isSenior = candidate.title?.toLowerCase().includes("senior");

    return [
      {
        question: `How do you handle performance optimization and scalability challenges in a production environment, specifically focusing on ${primarySkill}?`,
        type: "technical",
        thinkTime: 30,
        maxTime: 180
      },
      {
        question: isSenior 
          ? "Tell me about a time you had to align technical decisions across multiple teams or handle a conflict with a product manager."
          : "Tell me about a time you made a technical mistake on a project. How did you identify it and what did you learn?",
        type: "behavioral",
        thinkTime: 30,
        maxTime: 180
      },
      {
        question: isSenior
          ? "Imagine we need to migrate a legacy service to a microservices architecture. Walk me through your design process and data consistency strategy."
          : "If you were assigned a task with a technology you had never used before and a tight deadline, how would you approach it?",
        type: "situational",
        thinkTime: 30,
        maxTime: 180
      }
    ];
  }

  _runRuleBasedEvaluation(answers, jobTitle) {
    const evaluatedAnswers = answers.map((ans) => {
      const wordCount = ans.transcription?.split(/\s+/).length || 0;
      let relevance = 75, clarity = 80, specificity = 60, depth = 55;

      if (wordCount > 100) { specificity = 80; depth = 75; }
      if (wordCount > 200) { depth = 85; clarity = 70; }

      return {
        question: ans.question,
        relevance,
        clarity,
        specificity,
        depth,
        summary: `The candidate explained their experience and technical understanding of the topic in about ${wordCount} words.`
      };
    });

    return {
      answers: evaluatedAnswers,
      scorecard: {
        summary: `The candidate completed the interview. Overall, they demonstrated a solid grasp of requirements for the ${jobTitle} role.`,
        verdict: "Recommended",
        confidence: 80,
        followUpQuestions: [
          "Can you elaborate on the specific metrics of success for the project you described?",
          "How would you handle scaling that system if traffic increased by 10x?"
        ]
      }
    };
  }

  _generateMockTranscription(audioPath) {
    const filename = audioPath.toLowerCase();
    const sampleAnswers = [
      "To handle race conditions in distributed databases, I typically use a combination of optimistic locking and distributed transactions where absolute consistency is required. For example, in my previous role at Stripe, we used Redis-based distributed locks like Redlock for critical paths, but preferred idempotent APIs and optimistic concurrency control using version columns in PostgreSQL for most operations to keep latency low. We also structured our microservices to be stateless and designed all event consumers to be idempotent, which prevented duplicate processing when event brokers retried messages.",
      "I once disagreed with a product manager regarding the rollout of a new feature that would add significant database load. The PM wanted to release it immediately for a marketing event, but I argued that without proper caching, the database CPU would spike and degrade the core checkout flow. To resolve this, I proposed a compromise: we did a dark launch behind a feature flag, limiting the release to 5% of users. This allowed the marketing team to get their initial data, while I set up Redis caching. In the end, we rolled it out fully within 3 days without any performance issues, and the PM appreciated the data-driven safety measures."
    ];
    let sum = filename.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
    return sampleAnswers[sum % sampleAnswers.length];
  }
}
