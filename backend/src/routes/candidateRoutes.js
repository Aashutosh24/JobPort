import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  scrapeCandidatesForJob,
  getCandidatesForJob,
  updateCandidateStatus,
  sendInterviewInvitation,
} from "../controllers/candidateController.js";

const router = express.Router();

// All recruiter routes are protected by JWT auth
router.post("/job/:jobId/scrape", protect, scrapeCandidatesForJob);
router.get("/job/:jobId", protect, getCandidatesForJob);
router.put("/:id/status", protect, updateCandidateStatus);
router.post("/:id/invite", protect, sendInterviewInvitation);

export default router;
