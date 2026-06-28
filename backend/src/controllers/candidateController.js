import Candidate from "../models/Candidate.models.js";
import Job from "../models/Job.models.js";
import JobAnalysis from "../models/JobAnalysis.models.js";
import { runBackgroundScrapeAndScore } from "../services/scraperService.js";
import { generateQuestions } from "../services/interviewQuestionService.js";
import nodemailer from "nodemailer";

/**
 * Triggers candidate scraping in the background (non-blocking)
 */
export const scrapeCandidatesForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Trigger background process (don't await)
    runBackgroundScrapeAndScore(jobId).catch((err) =>
      console.error("❌ Background scraping error:", err.message)
    );

    return res.status(202).json({
      success: true,
      message: "Candidate scraping and scoring pipeline started in background.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Gets all candidates for a specific job
 */
export const getCandidatesForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const candidates = await Candidate.find({ jobId }).sort({ matchScore: -1 });

    return res.status(200).json({
      success: true,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Manually overrides a candidate's shortlist/reject status
 */
export const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Applied, Shortlisted, Rejected

    if (!["Applied", "Shortlisted", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Candidate status updated to ${status}`,
      candidate,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Sends an interview invitation email with a unique secure link.
 * Generates candidate-specific interview questions if they don't exist.
 */
export const sendInterviewInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const job = await Job.findById(candidate.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Associated job not found" });
    }

    // 1. Generate customized questions if not already generated
    if (!candidate.interviewQuestions || candidate.interviewQuestions.length === 0) {
      const questions = await generateQuestions(candidate, job);
      candidate.interviewQuestions = questions;
    }

    // 2. Update status
    candidate.interviewStatus = "Invited";
    await candidate.save();

    // 3. Construct unique links
    const webFallbackUrl = `http://localhost:5173/interview/${candidate.interviewToken}`;
    const deepLinkUrl = `jobport://interview/${candidate.interviewToken}`;

    // 4. Send email (simulated or real SMTP)
    console.log(`✉️ Sending invitation to ${candidate.name} (${candidate.email})`);
    console.log(`🔗 Web Fallback: ${webFallbackUrl}`);
    console.log(`🔗 App Deep Link: ${deepLinkUrl}`);

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.mailtrap.io",
        port: process.env.SMTP_PORT || 2525,
        auth: {
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
        },
      });

      const mailOptions = {
        from: '"TalentScreening AI" <interviews@talentscreen.ai>',
        to: candidate.email,
        subject: `Video Interview Invitation: ${job.title} at ${job.company}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4F7CFF;">You've Been Invited to Interview!</h2>
            <p>Hi ${candidate.name},</p>
            <p>Congratulations! You have been shortlisted for the <strong>${job.title}</strong> position at <strong>${job.company}</strong>.</p>
            <p>We use an asynchronous video interview format. You will be asked 3 tailored questions with 30 seconds of think time and up to 3 minutes to record each answer.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${webFallbackUrl}" style="background-color: #4F7CFF; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
                Start Video Interview (Web)
              </a>
            </div>

            <p style="font-size: 13px; color: #666;">
              If you are using an Android device with our app installed, you can open the interview directly: <br />
              <a href="${deepLinkUrl}" style="color: #4F7CFF;">Open in Expo Mobile App</a>
            </p>
            <p>Best of luck,<br/>The Hiring Team</p>
          </div>
        `,
      };

      // We send asynchronously so we don't block the API response
      transporter.sendMail(mailOptions).catch(err => 
        console.warn("⚠️ SMTP Email sending failed (this is normal if credentials aren't configured yet):", err.message)
      );

    } catch (emailError) {
      console.warn("⚠️ Email configuration error:", emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: `Interview invitation sent to ${candidate.name}`,
      webFallbackUrl,
      deepLinkUrl,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
