/**
 * Base AIProvider class (Interface)
 * All AI providers (local, hosted, etc.) must inherit from this class and implement these methods.
 */
export class AIProvider {
  /**
   * Extracts required skills, seniority, experience, and soft skills from a job description.
   * @param {string} description - The job description text.
   * @returns {Promise<object>} The structured job analysis.
   */
  async analyzeJob(description) {
    throw new Error("Method 'analyzeJob()' must be implemented.");
  }

  /**
   * Generates a dense embedding vector (384 dimensions) for the given text.
   * @param {string} text - The input text.
   * @returns {Promise<number[]>} The embedding vector.
   */
  async generateEmbedding(text) {
    throw new Error("Method 'generateEmbedding()' must be implemented.");
  }

  /**
   * Generates customized, candidate-specific interview questions.
   * @param {object} candidate - The candidate profile.
   * @param {object} job - The job description details.
   * @returns {Promise<object[]>} Array of question objects.
   */
  async generateQuestions(candidate, job) {
    throw new Error("Method 'generateQuestions()' must be implemented.");
  }

  /**
   * Evaluates candidate responses to generate scores and a final scorecard.
   * @param {object} candidate - The candidate profile.
   * @param {object} job - The job details.
   * @param {object[]} questions - The interview questions.
   * @param {object[]} answers - The candidate's recorded answers.
   * @returns {Promise<object>} The final scorecard and graded answers.
   */
  async evaluateInterview(candidate, job, questions, answers) {
    throw new Error("Method 'evaluateInterview()' must be implemented.");
  }

  /**
   * Transcribes an audio file.
   * @param {string} audioPath - Path to the audio file.
   * @returns {Promise<string>} The transcribed text.
   */
  async transcribeAudio(audioPath) {
    throw new Error("Method 'transcribeAudio()' must be implemented.");
  }
}
