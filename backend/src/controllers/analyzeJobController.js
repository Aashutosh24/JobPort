import Job from "../models/Job.models.js";
import JobAnalysis from "../models/JobAnalysis.models.js";
import analyzeJob from "../services/jobAnalysisService.js";

export const analyzeJobController = async (req, res) => {
  try {
    const { id } = req.params;

    // Find Job
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if Job is already analyzed
    let jobAnalysis = await JobAnalysis.findOne({ jobId: id });

    if (jobAnalysis) {
      return res.status(200).json({
        success: true,
        message: "Job already analyzed",
        analysis: jobAnalysis,
      });
    }

    // Call AI Service (Qwen 2.5 + BGE Embeddings)
    const analysis = await analyzeJob(job.description);

    // Save analysis to the separate JobAnalysis collection
    jobAnalysis = await JobAnalysis.create({
      jobId: id,
      ...analysis,
    });

    // Mark job as analyzed (optional, for quick checks)
    job.aiAnalysis = {
      analyzed: true,
    };
    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job analyzed successfully",
      analysis: jobAnalysis,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};