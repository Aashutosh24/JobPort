import fs from "fs";
import path from "path";
import Candidate from "../models/Candidate.models.js";
import Job from "../models/Job.models.js";
import { transcribeVideo } from "../services/whisperService.js";
import { evaluateInterview } from "../services/interviewEvaluationService.js";

/**
 * Validates a secure token and returns interview details
 */
export const getInterviewDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const candidate = await Candidate.findOne({ interviewToken: token });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Interview link is invalid or expired" });
    }

    const job = await Job.findById(candidate.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Associated job description not found" });
    }

    return res.status(200).json({
      success: true,
      candidate: {
        name: candidate.name,
        email: candidate.email,
        interviewStatus: candidate.interviewStatus,
      },
      job: {
        title: job.title,
        company: job.company,
      },
      questions: candidate.interviewQuestions || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Returns list of already uploaded chunks for a question (resumable uploads)
 */
export const getUploadStatus = async (req, res) => {
  try {
    const { token } = req.params;
    const { questionIndex } = req.query;

    if (questionIndex === undefined) {
      return res.status(400).json({ success: false, message: "questionIndex is required" });
    }

    const chunkDir = path.join("uploads", "chunks", token, String(questionIndex));
    
    let uploadedChunks = [];
    if (fs.existsSync(chunkDir)) {
      uploadedChunks = fs.readdirSync(chunkDir)
        .map(file => parseInt(file.split(".")[0]))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);
    }

    return res.status(200).json({
      success: true,
      uploadedChunks,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handles uploading a single chunk of video.
 * Merges chunks into a single mp4 file when the last chunk is received.
 */
export const uploadAnswerChunk = async (req, res) => {
  try {
    const { token } = req.params;
    const { chunkIndex, totalChunks, questionIndex } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No chunk file received" });
    }

    const qIdx = parseInt(questionIndex);
    const cIdx = parseInt(chunkIndex);
    const tChunks = parseInt(totalChunks);

    // 1. Save chunk in temp folder
    const chunkDir = path.join("uploads", "chunks", token, String(qIdx));
    fs.mkdirSync(chunkDir, { recursive: true });

    const chunkPath = path.join(chunkDir, `${cIdx}.tmp`);
    fs.renameSync(req.file.path, chunkPath);

    // 2. Check if all chunks are uploaded
    const files = fs.readdirSync(chunkDir);
    if (files.length === tChunks) {
      // Create final videos directory
      const videoDir = path.join("uploads", "videos");
      fs.mkdirSync(videoDir, { recursive: true });

      const finalVideoPath = path.join(videoDir, `${token}-q${qIdx}.mp4`);
      const writeStream = fs.createWriteStream(finalVideoPath);

      // Merge chunks sequentially
      for (let i = 0; i < tChunks; i++) {
        const partPath = path.join(chunkDir, `${i}.tmp`);
        const buffer = fs.readFileSync(partPath);
        writeStream.write(buffer);
        fs.unlinkSync(partPath); // delete temp chunk
      }
      writeStream.end();

      // Clean up empty chunk directory
      fs.rmdirSync(chunkDir);

      // Save video url in candidate document
      const candidate = await Candidate.findOne({ interviewToken: token });
      if (candidate) {
        // Update or insert the answer
        const videoUrl = `/uploads/videos/${token}-q${qIdx}.mp4`;
        
        // Find existing answer or push a new one
        const existingAnswerIdx = candidate.interviewAnswers.findIndex(ans => ans.question === candidate.interviewQuestions[qIdx].question);
        
        if (existingAnswerIdx > -1) {
          candidate.interviewAnswers[existingAnswerIdx].videoUrl = videoUrl;
        } else {
          candidate.interviewAnswers.push({
            question: candidate.interviewQuestions[qIdx].question,
            videoUrl,
            transcription: "",
          });
        }
        
        candidate.interviewStatus = "In Progress";
        await candidate.save();
      }

      return res.status(201).json({
        success: true,
        message: "All chunks received. Video merged successfully.",
        videoUrl: `/uploads/videos/${token}-q${qIdx}.mp4`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Chunk ${cIdx + 1}/${tChunks} uploaded successfully.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submits the completed interview and triggers background AI evaluation (Whisper + Qwen)
 */
export const submitInterview = async (req, res) => {
  try {
    const { token } = req.params;

    const candidate = await Candidate.findOne({ interviewToken: token });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    candidate.interviewStatus = "Completed";
    candidate.processingStatus = "Processing";
    await candidate.save();

    // Start background transcription & evaluation
    runBackgroundEvaluation(token).catch((err) =>
      console.error(`❌ Background evaluation failed for token ${token}:`, err.message)
    );

    return res.status(200).json({
      success: true,
      message: "Interview submitted successfully. AI evaluation is in progress.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Runs the background evaluation pipeline (non-blocking)
 */
async function runBackgroundEvaluation(token) {
  console.log(`🚀 Starting background interview evaluation for candidate token: ${token}`);

  const candidate = await Candidate.findOne({ interviewToken: token });
  if (!candidate) return;

  const job = await Job.findById(candidate.jobId);
  if (!job) return;

  try {
    // 1. Transcribe each video using Whisper
    for (const answer of candidate.interviewAnswers) {
      if (answer.videoUrl && !answer.transcription) {
        const localVideoPath = path.join(process.cwd(), answer.videoUrl);
        console.log(`🎙️ Transcribing: ${localVideoPath}`);
        const text = await transcribeVideo(localVideoPath);
        answer.transcription = text;
      }
    }

    await candidate.save();

    // 2. Evaluate transcripts using Qwen 2.5
    console.log("🧠 Evaluating transcripts with Qwen 2.5...");
    const evaluation = await evaluateInterview(
      candidate,
      job,
      candidate.interviewQuestions,
      candidate.interviewAnswers
    );

    // 3. Update candidate with scores and scorecard
    candidate.interviewAnswers.forEach((ans) => {
      const evalAns = evaluation.answers.find(ea => ea.question === ans.question);
      if (evalAns) {
        ans.relevance = evalAns.relevance;
        ans.clarity = evalAns.clarity;
        ans.specificity = evalAns.specificity;
        ans.depth = evalAns.depth;
        ans.summary = evalAns.summary;
      }
    });

    candidate.scorecard = evaluation.scorecard;
    candidate.processingStatus = "Completed";
    await candidate.save();

    console.log(`✅ Completed background interview evaluation for: ${candidate.name}`);

  } catch (error) {
    console.error(`❌ Background evaluation failed for ${candidate.name}:`, error.message);
    candidate.processingStatus = "Failed";
    await candidate.save();
  }
}
