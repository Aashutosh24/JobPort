import mongoose from "mongoose";

const jobAnalysisSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      unique: true,
    },
    extractedSkills: [
      {
        skill: { type: String, required: true },
        confidence: { type: Number, default: 100 },
        level: { type: String, default: "mid" },
      },
    ],
    preferredSkills: [
      {
        skill: { type: String, required: true },
        confidence: { type: Number, default: 100 },
      },
    ],
    softSkills: [
      {
        skill: { type: String, required: true },
        confidence: { type: Number, default: 100 },
      },
    ],
    implicitRequirements: [
      {
        requirement: { type: String, required: true },
        confidence: { type: Number, default: 100 },
      },
    ],
    seniority: {
      level: { type: String, required: true },
      confidence: { type: Number, default: 100 },
    },
    experienceRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      confidence: { type: Number, default: 100 },
    },
    searchQueries: [String],
    embedding: [Number], // 384-dimensional vector
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("JobAnalysis", jobAnalysisSchema);
