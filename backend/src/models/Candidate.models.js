import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
    },
    profileUrl: {
      type: String,
    },
    skills: [String],
    experienceSummary: String,
    experienceYears: Number,
    source: {
      type: String,
      default: "Public Search",
    },
    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Rejected"],
      default: "Applied",
    },
    interviewStatus: {
      type: String,
      enum: ["Not Invited", "Invited", "In Progress", "Completed"],
      default: "Not Invited",
    },
    interviewToken: {
      type: String,
      required: true,
      unique: true,
    },
    embedding: [Number], // 384-dimensional vector
    matchScore: {
      type: Number,
      default: 0,
    },
    scoreBreakdown: {
      technicalFit: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      domainMatch: { type: Number, default: 0 },
      communicationPrediction: { type: Number, default: 0 },
      educationMatch: { type: Number, default: 0 },
      locationMatch: { type: Number, default: 0 },
      resumeQuality: { type: Number, default: 0 }
    },
    flags: [String],
    redFlags: [{
      reason: String,
      severity: { type: String, enum: ["Low", "Medium", "High", "Critical"] }
    }],
    strengths: [String],
    aiRecommendation: {
      type: String,
      enum: ["Highly Recommended", "Recommended", "Consider", "Reject", "Pending"],
      default: "Pending"
    },
    overallRank: Number,
    percentile: Number,
    expectedSalary: String,
    availability: String,
    isSynthetic: { type: Boolean, default: false },
    interviewQuestions: [
      {
        question: { type: String, required: true },
        type: { type: String, required: true },
        thinkTime: { type: Number, default: 30 },
        maxTime: { type: Number, default: 180 },
      },
    ],
    interviewAnswers: [
      {
        question: { type: String, required: true },
        videoUrl: { type: String },
        transcription: { type: String },
        relevance: { type: Number, default: 0 },
        clarity: { type: Number, default: 0 },
        specificity: { type: Number, default: 0 },
        depth: { type: Number, default: 0 },
        summary: { type: String },
      },
    ],
    scorecard: {
      summary: String,
      verdict: String,
      confidence: Number,
      followUpQuestions: [String],
    },
    scrapingJobId: String,
    processingStatus: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Candidate", candidateSchema);
