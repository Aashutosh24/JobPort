import express from "express";

import protect from "../middlewares/authMiddleware.js";
import { analyzeJobController } from "../controllers/analyzeJobController.js";

import {
  createJob,
  getJobs,
  getSingleJob,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";

const router = express.Router();

router.post("/", protect, createJob);

router.get("/", protect, getJobs);

router.get("/:id", protect, getSingleJob);
router.post("/:id/analyze", protect, analyzeJobController);

router.put("/:id", protect, updateJob);

router.delete("/:id", protect, deleteJob);

export default router;