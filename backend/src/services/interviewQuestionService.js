import axios from "axios";

/**
 * Generates candidate-specific interview questions based on the job description and candidate profile.
 * Calibrates questions based on listed skills and seniority level.
 */
export const generateQuestions = async (candidate, job) => {
  if (!candidate || !job) {
    throw new Error("Candidate and Job are required to generate questions.");
  }

  let questions = [];

  try {
    const hfToken = process.env.HF_TOKEN;
    const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};

    const prompt = `You are an expert technical interviewer. Generate exactly 3 customized interview questions for this candidate based on the job description and the candidate's profile.
Your response MUST be a valid JSON array of objects ONLY. Do not include any markdown formatting, backticks, or introduction text.

Job Description:
Title: ${job.title}
Required Skills: ${job.requiredSkills?.join(", ") || "None listed"}
Experience: ${job.experience}

Candidate Profile:
Name: ${candidate.name}
Stated Title: ${candidate.title}
Skills: ${candidate.skills?.join(", ") || "None listed"}
Experience Summary: ${candidate.experienceSummary || "None"}
Experience Years: ${candidate.experienceYears || "Not specified"}

Rules:
1. Question 1 must be a deep technical question targeting one of their primary skills (e.g., if they have Python/React listed, ask a deep technical question on that skill, or system design if they are senior).
2. Question 2 must be a behavioral question calibrated to their seniority level (e.g. leadership/mentorship for seniors, teamwork/adaptability for juniors).
3. Question 3 must be a situational problem-solving question relevant to the job's daily duties.
4. Keep the question text concise and clear.

JSON Schema:
[
  {
    "question": "Question text here",
    "type": "technical|behavioral|situational",
    "thinkTime": 30,
    "maxTime": 180
  }
]`;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
      { inputs: prompt, parameters: { max_new_tokens: 600, return_full_text: false } },
      { headers, timeout: 15000 }
    );

    let textResponse = "";
    if (Array.isArray(response.data)) {
      textResponse = response.data[0]?.generated_text || "";
    } else if (response.data?.generated_text) {
      textResponse = response.data.generated_text;
    }

    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    questions = JSON.parse(textResponse);

  } catch (error) {
    console.warn("⚠️ Qwen 2.5 Question Gen API failed, using fallback questions:", error.message);
    questions = generateFallbackQuestions(candidate, job);
  }

  // Ensure each question has default thinkTime and maxTime
  return questions.map(q => ({
    question: q.question || "Tell us about a technical challenge you solved.",
    type: q.type || "technical",
    thinkTime: q.thinkTime || 30,
    maxTime: q.maxTime || 180
  }));
};

/**
 * Fallback question generator
 */
function generateFallbackQuestions(candidate, job) {
  const skills = candidate.skills || [];
  const primarySkill = skills[0] || "Software Engineering";
  const title = candidate.title || "Software Engineer";
  const isSenior = title.toLowerCase().includes("senior") || title.toLowerCase().includes("lead");

  const questions = [
    {
      question: `How do you handle performance optimization and scalability challenges in a production environment, specifically focusing on ${primarySkill}?`,
      type: "technical",
      thinkTime: 30,
      maxTime: 180
    }
  ];

  if (isSenior) {
    questions.push({
      question: "Tell me about a time you had to align technical decisions across multiple teams or handle a conflict with a product manager.",
      type: "behavioral",
      thinkTime: 30,
      maxTime: 180
    });
    questions.push({
      question: "Imagine we need to migrate a legacy service to a microservices architecture. Walk me through your design process, data consistency strategy, and how you minimize downtime.",
      type: "situational",
      thinkTime: 30,
      maxTime: 180
    });
  } else {
    questions.push({
      question: "Tell me about a time you made a technical mistake on a project. How did you identify it, communicate it to the team, and what did you learn?",
      type: "behavioral",
      thinkTime: 30,
      maxTime: 180
    });
    questions.push({
      question: "If you were assigned a task with a technology you had never used before and a tight deadline, how would you approach learning it and delivering the task?",
      type: "situational",
      thinkTime: 30,
      maxTime: 180
    });
  }

  return questions;
}
