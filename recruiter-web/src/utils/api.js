const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  register: async (name, email, password, company) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, company }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Jobs
  getJobs: async () => {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch jobs");
    return data.jobs;
  },

  getJobDetails: async (id) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch job details");
    return data.job;
  },

  createJob: async (jobData) => {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create job");
    return data.job;
  },

  analyzeJob: async (id) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}/analyze`, {
      method: "POST",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to analyze job");
    return data.analysis;
  },

  // Candidates
  getCandidates: async (jobId) => {
    const res = await fetch(`${API_BASE_URL}/candidates/job/${jobId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch candidates");
    return data.candidates;
  },

  scrapeCandidates: async (jobId) => {
    const res = await fetch(`${API_BASE_URL}/candidates/job/${jobId}/scrape`, {
      method: "POST",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to start scraping");
    return data;
  },

  updateCandidateStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/candidates/${id}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update candidate status");
    return data.candidate;
  },

  inviteCandidate: async (id, customEmail) => {
    const res = await fetch(`${API_BASE_URL}/candidates/${id}/invite`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ customEmail }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send interview invitation");
    return data;
  },
};
