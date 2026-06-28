import express from "express";
import multer from "multer";
import {
  getInterviewDetails,
  getUploadStatus,
  uploadAnswerChunk,
  submitInterview,
} from "../controllers/interviewController.js";

const router = express.Router();

// Configure multer for temporary chunk storage
const upload = multer({ 
  dest: "uploads/temp/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per chunk
});

// Candidate facing public routes
router.get("/:token", getInterviewDetails);
router.get("/:token/upload-status", getUploadStatus);
router.post("/:token/upload-chunk", upload.single("chunk"), uploadAnswerChunk);
router.post("/:token/submit", submitInterview);

export default router;
