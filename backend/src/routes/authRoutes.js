import express from "express";

import {
  register,
  login,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);
console.log("✅ Auth Routes Loaded");

export default router;