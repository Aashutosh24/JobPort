import Job from "../models/Job.models.js";
import analyzeJob from "../services/jobAnalysis.js";

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

    // Prevent duplicate analysis (optional)
    if (job.aiAnalysis?.analyzed) {
      return res.status(200).json({
        success: true,
        message: "Job already analyzed",
        analysis: job.aiAnalysis,
      });
    }

    // Call AI Service
    const analysis = await analyzeJob(job.description);

    // Save analysis to MongoDB
    job.aiAnalysis = {
      ...analysis,
      analyzed: true,
    };

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job analyzed successfully",
      analysis: job.aiAnalysis,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};