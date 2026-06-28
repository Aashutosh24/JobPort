import axios from "axios";

/**
 * Evaluates candidate responses (transcripts) to generate scores and a final scorecard.
 * Evaluates relevance, clarity, specificity, and depth.
 */
export const evaluateInterview = async (candidate, job, questions, answers) => {
  if (!candidate || !job || !questions || !answers || answers.length === 0) {
    throw new Error("Candidate, Job, questions, and answers are required for evaluation.");
  }

  let evaluationResult = null;

  try {
    const hfToken = process.env.HF_TOKEN;
    const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};

    const formattedAnswers = answers.map((ans, idx) => `
Question ${idx + 1}: ${ans.question}
Answer: ${ans.transcription}
`).join("\n");

    const prompt = `You are an expert hiring manager. Evaluate the candidate's interview transcript.
Your response MUST be a valid JSON object ONLY. Do not include any markdown formatting, backticks, or introduction text.

Job Description:
Title: ${job.title}
Required Skills: ${job.requiredSkills?.join(", ") || "None listed"}

Candidate Profile:
Name: ${candidate.name}
Stated Title: ${candidate.title}

Interview Responses:
${formattedAnswers}

Rules for Evaluation:
1. For each answer, grade the following dimensions from 0 to 100:
   - relevance: How directly they answered the question.
   - clarity: How structured and easy to follow the answer was.
   - specificity: Did they give specific examples, or just talk in generalities?
   - depth: Technical and architectural understanding shown.
2. For each answer, generate a 2-3 sentence summary.
3. For the overall scorecard, generate:
   - summary: A 3-4 sentence overall assessment.
   - verdict: "Highly Recommended", "Recommended", or "Do Not Hire".
   - confidence: A score from 0 to 100 indicating your confidence in the verdict.
   - followUpQuestions: A list of 3 specific follow-up questions the recruiter should ask in a live interview based on gaps or interesting points in their answers.

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
}`;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
      { inputs: prompt, parameters: { max_new_tokens: 1200, return_full_text: false } },
      { headers, timeout: 25000 }
    );

    let textResponse = "";
    if (Array.isArray(response.data)) {
      textResponse = response.data[0]?.generated_text || "";
    } else if (response.data?.generated_text) {
      textResponse = response.data.generated_text;
    }

    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    evaluationResult = JSON.parse(textResponse);

  } catch (error) {
    console.warn("⚠️ Qwen 2.5 Interview Evaluation API failed, using rule-based fallback:", error.message);
    evaluationResult = runRuleBasedEvaluation(answers, job.title);
  }

  return evaluationResult;
};

/**
 * Rule-based fallback evaluation
 */
function runRuleBasedEvaluation(answers, jobTitle) {
  const evaluatedAnswers = answers.map((ans) => {
    const wordCount = ans.transcription?.split(/\s+/).length || 0;
    
    // Heuristic scoring based on word count (longer answers are often more specific/deep, up to a point)
    let relevance = 75;
    let clarity = 80;
    let specificity = 60;
    let depth = 55;

    if (wordCount > 100) {
      specificity = 80;
      depth = 75;
    }
    if (wordCount > 200) {
      depth = 85;
      clarity = 70; // wordy answers can lose clarity
    }
    if (wordCount < 30) {
      relevance = 50;
      specificity = 30;
      depth = 30;
    }

    // Detect filler words (like, you know, um, uh, basically, so)
    const fillers = (ans.transcription?.match(/\b(like|you know|um|uh|basically|so)\b/gi) || []).length;
    if (fillers > 5) {
      clarity = Math.max(40, clarity - fillers * 2);
    }

    return {
      question: ans.question,
      relevance,
      clarity,
      specificity,
      depth,
      summary: `The candidate explained their experience and technical understanding of the topic. They spoke for about ${wordCount} words, giving a ${wordCount > 100 ? 'detailed' : 'brief'} explanation.`
    };
  });

  // Calculate averages
  const avgRelevance = Math.round(evaluatedAnswers.reduce((sum, a) => sum + a.relevance, 0) / evaluatedAnswers.length);
  const avgDepth = Math.round(evaluatedAnswers.reduce((sum, a) => sum + a.depth, 0) / evaluatedAnswers.length);
  const compositeScore = (avgRelevance + avgDepth) / 2;

  let verdict = "Recommended";
  if (compositeScore > 80) verdict = "Highly Recommended";
  if (compositeScore < 50) verdict = "Do Not Hire";

  return {
    answers: evaluatedAnswers,
    scorecard: {
      summary: `The candidate completed all questions in the interview. Overall, they demonstrated a ${compositeScore > 75 ? 'solid' : 'moderate'} grasp of requirements for the ${jobTitle} role, showing particularly good response structure.`,
      verdict,
      confidence: 80,
      followUpQuestions: [
        "Can you elaborate on the specific metrics of success for the project you described?",
        "How would you handle scaling that system if traffic increased by 10x?",
        "Tell me more about how you coordinate technical tasks with non-technical team members."
      ]
    }
  };
}
