export class RankingEngineService {
  /**
   * Calculates a full, real scorecard from actual candidate and job data.
   * No stub values — every number derives from actual fields.
   */
  calculateCandidateScore(candidate, jobAnalysis, semanticSimilarity) {
    const similarity = Math.max(0, Math.min(1, semanticSimilarity || 0));

    // 1. TECHNICAL FIT — how many required skills does this candidate have?
    const requiredSkills = (jobAnalysis.extractedSkills || []).map(s => (s.skill || s).toLowerCase());
    const preferredSkills = (jobAnalysis.preferredSkills || []).map(s => (s.skill || s).toLowerCase());
    const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());

    const matchedRequired = requiredSkills.filter(s => candidateSkills.some(c => c.includes(s) || s.includes(c)));
    const matchedPreferred = preferredSkills.filter(s => candidateSkills.some(c => c.includes(s) || s.includes(c)));

    const requiredCoverage = requiredSkills.length > 0 ? matchedRequired.length / requiredSkills.length : 0.5;
    const preferredCoverage = preferredSkills.length > 0 ? matchedPreferred.length / preferredSkills.length : 0.5;

    // Technical Fit: 60% required skills coverage + 20% preferred + 20% embedding similarity
    const technicalFit = Math.round(
      (requiredCoverage * 0.6 + preferredCoverage * 0.2 + similarity * 0.2) * 100
    );

    // 2. EXPERIENCE MATCH — how does candidate years compare to what the job requires?
    const candidateYears = candidate.experienceYears || 0;
    const minRequired = jobAnalysis.experienceRange?.min || 0;
    const maxRequired = jobAnalysis.experienceRange?.max || 10;

    let experienceMatch;
    if (candidateYears >= minRequired && candidateYears <= maxRequired) {
      experienceMatch = 95; // exactly in range
    } else if (candidateYears > maxRequired) {
      experienceMatch = Math.max(60, 95 - (candidateYears - maxRequired) * 5); // overqualified penalty
    } else {
      // underqualified: drops 20 points per missing year
      experienceMatch = Math.max(10, 95 - (minRequired - candidateYears) * 20);
    }

    // 3. DOMAIN MATCH — does the candidate's company/summary match the job's domain?
    const domain = (jobAnalysis.domain || "General Tech").toLowerCase();
    const companyText = ((candidate.company || "") + " " + (candidate.experienceSummary || "")).toLowerCase();
    let domainMatch = 50; // baseline
    const domainKeywordMap = {
      fintech: ["fintech", "payment", "bank", "finance", "stripe", "razorpay", "paytm", "zepto", "bnpl"],
      healthcare: ["health", "medical", "hospital", "pharma", "clinical"],
      edtech: ["edtech", "education", "learning", "teaching", "byju", "unacademy", "coursera"],
      "ai/ml": ["ai", "ml", "machine learning", "deep learning", "nlp", "llm", "openai", "hugging face", "data science"],
      "e-commerce": ["ecommerce", "e-commerce", "amazon", "flipkart", "retail", "shopping"],
    };

    const domainKeywords = domainKeywordMap[domain] || [];
    if (domainKeywords.some(kw => companyText.includes(kw))) {
      domainMatch = 92; // strong domain match
    } else if (domain === "general tech") {
      domainMatch = 75; // general tech always reasonable
    }

    // 4. LOCATION MATCH — simple check
    const jobLocation = (jobAnalysis.searchQueries?.[0] || "").toLowerCase();
    const candidateSummary = (candidate.experienceSummary || "").toLowerCase();
    const locationMatch = candidateSummary.includes("remote") ||
      candidateSummary.includes("bangalore") ||
      candidateSummary.includes("mumbai") ||
      candidateSummary.includes("delhi") ? 90 : 70;

    // 5. RESUME QUALITY — based on data richness
    let resumeQuality = 50;
    if (candidate.skills?.length > 3) resumeQuality += 10;
    if (candidate.experienceSummary && candidate.experienceSummary.length > 80) resumeQuality += 15;
    if (candidate.company && candidate.company !== "Public Profile" && candidate.company !== "Independent") resumeQuality += 10;
    if (candidate.profileUrl) resumeQuality += 10;
    resumeQuality = Math.min(95, resumeQuality);

    // 6. COMMUNICATION PREDICTION — based on summary text quality
    const summaryWords = (candidate.experienceSummary || "").split(/\s+/).length;
    const communicationPrediction = summaryWords > 50 ? 80 : summaryWords > 20 ? 70 : 55;

    // 7. EDUCATION MATCH — basic heuristic
    const educationMatch = companyText.includes("phd") || companyText.includes("iit") || companyText.includes("iim")
      ? 95 : 75;

    // 8. OVERALL SCORE — weighted sum
    const matchScore = Math.round(
      technicalFit * 0.35 +
      experienceMatch * 0.20 +
      domainMatch * 0.20 +
      resumeQuality * 0.10 +
      locationMatch * 0.05 +
      communicationPrediction * 0.05 +
      educationMatch * 0.05
    );

    // 9. RED FLAGS — detected from actual data
    const redFlags = [];
    const missingSkills = requiredSkills.filter(s => !candidateSkills.some(c => c.includes(s) || s.includes(c)));
    if (missingSkills.length > 0) {
      redFlags.push({ reason: `Missing required skills: ${missingSkills.slice(0, 3).join(", ")}`, severity: missingSkills.length > 2 ? "High" : "Medium" });
    }
    if (candidateYears < minRequired) {
      redFlags.push({ reason: `Under-experienced: needs ${minRequired}+ years, has ~${candidateYears}`, severity: "Medium" });
    }
    if (candidate.isSynthetic) {
      redFlags.push({ reason: "Synthetic profile: real candidate data unavailable from LinkedIn", severity: "Low" });
    }
    if (!candidate.profileUrl) {
      redFlags.push({ reason: "No verified LinkedIn/GitHub profile URL", severity: "Low" });
    }

    // 10. STRENGTHS — detected from actual matched data
    const strengths = [];
    if (matchedRequired.length === requiredSkills.length && requiredSkills.length > 0) {
      strengths.push("100% required skill coverage");
    } else if (matchedRequired.length > 0) {
      strengths.push(`Matches ${matchedRequired.length}/${requiredSkills.length} required skills`);
    }
    if (candidateYears >= minRequired) {
      strengths.push(`${candidateYears}+ years relevant experience`);
    }
    if (domainMatch > 85) {
      strengths.push("Strong domain alignment");
    }
    if (matchedPreferred.length > 0) {
      strengths.push(`Bonus skills: ${matchedPreferred.slice(0, 2).join(", ")}`);
    }
    if (strengths.length === 0) {
      strengths.push("Broad engineering background");
    }

    // 11. RECOMMENDATION
    let aiRecommendation;
    if (matchScore >= 85) aiRecommendation = "Highly Recommended";
    else if (matchScore >= 72) aiRecommendation = "Recommended";
    else if (matchScore >= 55) aiRecommendation = "Consider";
    else aiRecommendation = "Reject";

    return {
      matchScore,
      scoreBreakdown: {
        technicalFit,
        technicalSkills: technicalFit,
        experienceMatch,
        seniorityIndicators: experienceMatch,
        domainMatch,
        domainExperience: domainMatch,
        communicationPrediction,
        educationMatch,
        locationMatch,
        resumeQuality,
      },
      redFlags,
      strengths,
      aiRecommendation,
    };
  }

  /**
   * Assigns overall rank and percentile to all candidates after all are scored.
   */
  rankAll(candidates) {
    const sorted = [...candidates].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const total = sorted.length;
    return sorted.map((c, idx) => ({
      ...c,
      overallRank: idx + 1,
      percentile: Math.round(((total - idx - 1) / Math.max(1, total - 1)) * 100),
    }));
  }
}
