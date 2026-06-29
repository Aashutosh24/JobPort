import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    employmentType: {
      type: String,
      enum: [
        "Full-time",
        "Part-time",
        "Internship",
        "Contract",
        "Remote",
        "Hybrid",
      ],
    },

    experience: {
      type: String,
      required: true,
    },

    salary: String,

    requiredSkills: [String],

    preferredSkills: [String],

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Open",
    },
    aiAnalysis: {
      extractedSkills: [{
        skill: String,
        confidence: Number,
        level: String
      }],
      preferredSkills: [{
        skill: String,
        confidence: Number
      }],
      softSkills: [{
        skill: String,
        confidence: Number
      }],
      implicitRequirements: [{
        requirement: String,
        confidence: Number
      }],
      seniority: {
        level: String,
        confidence: Number
      },
      experienceRange: {
        min: Number,
        max: Number,
        confidence: Number
      },
      domain: String,
      keywords: [String],
      searchQueries: [String],
      analyzed: {
        type: Boolean,
        default: false
      }
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Job", jobSchema);