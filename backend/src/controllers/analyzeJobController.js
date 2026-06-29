import Job from "../models/Job.models.js";
import JobAnalysis from "../models/JobAnalysis.models.js";
import { getAIProvider } from "../services/ai/factory.js";

export const analyzeJobController = async (req, res) => {
  try {
    const { id } = req.params;

    // Find Job
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // If already analyzed, delete the old analysis so we get a fresh one
    await JobAnalysis.deleteOne({ jobId: id });

    // Get AI Provider
    const aiProvider = getAIProvider();

    // Call AI Service - pass the full job including the explicit experience range
    const analysis = await aiProvider.analyzeJob(job.description, {
      explicitExperience: job.experience,  // e.g. "2-3 years" from the form
      title: job.title,
      location: job.location,
    });

    // Save analysis
    const jobAnalysis = await JobAnalysis.create({
      jobId: id,
      ...analysis,
    });

    // Mark job as analyzed with full details
    job.aiAnalysis = {
      analyzed: true,
      extractedSkills: analysis.extractedSkills,
      preferredSkills: analysis.preferredSkills,
      softSkills: analysis.softSkills,
      implicitRequirements: analysis.implicitRequirements,
      seniority: analysis.seniority,
      experienceRange: analysis.experienceRange,
      domain: analysis.domain,
      searchQueries: analysis.searchQueries,
    };
    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job analyzed successfully",
      analysis: jobAnalysis,
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};