import dotenv from "dotenv";
import path from "path";
import analyzeJob from "../src/services/jobAnalysisService.js";
import { getEmbedding, calculateCosineSimilarity } from "../src/services/embeddingService.js";
import { scoreCandidate } from "../src/services/semanticScoringService.js";
import { generateQuestions } from "../src/services/interviewQuestionService.js";
import { evaluateInterview } from "../src/services/interviewEvaluationService.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const sampleJobDescription = `
We are looking for a Senior Backend Engineer to join our team. 
You will build scalable distributed systems, design RESTful APIs, and manage microservices.
Required Skills:
- Node.js / Express
- MongoDB or PostgreSQL
- System Design and Scalable Architecture
- AWS (EC2, S3, RDS)
Experience: 5+ years. 
Must work well in a fast-paced environment and mentor junior engineers.
`;

const sampleCandidate = {
  name: "Marcus Chen",
  title: "Senior Software Engineer",
  company: "Tech Startups Inc.",
  skills: ["Node.js", "PostgreSQL", "Docker", "AWS", "System Design"],
  experienceSummary: "Senior engineer with 6 years of experience building scalable backend APIs. Led a team of 3 juniors, designed microservices, and migrated databases to AWS.",
  experienceYears: 6,
};

async function runTest() {
  console.log("🚀 Starting E2E AI Pipeline Integration Test...\n");

  if (!process.env.HF_TOKEN) {
    console.log("⚠️ HF_TOKEN not found in environment. Using local rule-based fallbacks.");
  } else {
    console.log("✅ HF_TOKEN found. Running real Qwen 2.5 and BGE Inference.");
  }

  try {
    // 1. Test Job Analysis
    console.log("\n--- 1. Testing Job Description Analysis ---");
    const analysis = await analyzeJob(sampleJobDescription);
    console.log("Seniority Extracted:", analysis.seniority.level);
    console.log("Required Skills:", analysis.extractedSkills.map(s => s.skill).join(", "));
    console.log("Implicit Requirements:", analysis.implicitRequirements.map(r => r.requirement).join(", "));
    console.log("Embedding Vector Length:", analysis.embedding.length);

    // 2. Test Embedding and Cosine Similarity
    console.log("\n--- 2. Testing BGE Embeddings & Cosine Similarity ---");
    const candidateText = `${sampleCandidate.title} ${sampleCandidate.skills.join(", ")} ${sampleCandidate.experienceSummary}`;
    const candidateEmbedding = await getEmbedding(candidateText);
    const similarity = calculateCosineSimilarity(analysis.embedding, candidateEmbedding);
    console.log("Cosine Similarity:", similarity.toFixed(4));
    console.log("Semantic Match Score:", Math.round(similarity * 100) + "%");

    // 3. Test Candidate Scoring & Red Flag Detection
    console.log("\n--- 3. Testing Candidate Scoring & Red Flags ---");
    // Mock job object for controller signature compatibility
    const mockJob = {
      title: "Senior Backend Engineer",
      company: "Acme Corp",
      requiredSkills: ["Node.js", "PostgreSQL", "AWS"],
      experience: "5+ years",
      description: sampleJobDescription
    };
    const scoring = await scoreCandidate(sampleCandidate, mockJob, analysis);
    console.log("Semantic Match Score:", scoring.matchScore + "%");
    console.log("Breakdown:", JSON.stringify(scoring.scoreBreakdown));
    console.log("Red Flags Detected:", scoring.flags.length > 0 ? scoring.flags : "None");
    console.log("AI Match Summary:", scoring.summary);

    // 4. Test Interview Question Generation
    console.log("\n--- 4. Testing Customized Question Generation ---");
    const questions = await generateQuestions(sampleCandidate, mockJob);
    questions.forEach((q, idx) => {
      console.log(`Q${idx + 1} (${q.type}): "${q.question}"`);
    });

    // 5. Test Interview Evaluation
    console.log("\n--- 5. Testing Interview Response Evaluation ---");
    const sampleAnswers = [
      {
        question: questions[0].question,
        transcription: "To handle scalability in Node.js, I use clustering and load balancing. In my last project, I optimized our PostgreSQL queries by adding composite indexes and setting up Redis cache for heavy read queries. We also offloaded background tasks like email notifications to RabbitMQ, which reduced our API response times by 40%."
      },
      {
        question: questions[1].question,
        transcription: "When mentoring junior developers, I focus on pair programming and clear constructive code reviews. I believe in giving them ownership of smaller features while providing a safety net through staging environments and comprehensive unit tests."
      },
      {
        question: questions[2].question,
        transcription: "If a production database goes down, the first step is to check our monitoring alerts to identify if it is a connection limit issue or disk space issue. We have replica databases on AWS, so we would failover to the read replica to keep the service online while we investigate the primary database logs."
      }
    ];

    const evaluation = await evaluateInterview(sampleCandidate, mockJob, questions, sampleAnswers);
    console.log("Overall Verdict:", evaluation.scorecard.verdict);
    console.log("Verdict Confidence:", evaluation.scorecard.confidence + "%");
    console.log("Assessment Summary:", evaluation.scorecard.summary);
    console.log("Live Follow-Up Questions:");
    evaluation.scorecard.followUpQuestions.forEach((q, idx) => {
      console.log(`- ${q}`);
    });

    console.log("\n✅ E2E AI Pipeline Integration Test Completed Successfully!");

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
  }
}

runTest();
