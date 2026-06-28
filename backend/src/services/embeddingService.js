import axios from "axios";

/**
 * Generate BGE embeddings (384 dimensions) using BAAI/bge-small-en-v1.5
 * Falls back to a deterministic hashing mechanism if offline or API fails.
 */
export const getEmbedding = async (text) => {
  if (!text || typeof text !== "string") {
    return new Array(384).fill(0);
  }

  const cleanText = text.trim();

  // Try Hugging Face Inference API
  try {
    const hfToken = process.env.HF_TOKEN;
    const headers = hfToken ? { Authorization: `Bearer ${hfToken}` } : {};
    
    const response = await axios.post(
      "https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5",
      { inputs: cleanText },
      { headers, timeout: 5000 }
    );

    if (Array.isArray(response.data) && response.data.length === 384) {
      return response.data;
    }
  } catch (error) {
    console.warn("⚠️ BGE Embedding API failed, using deterministic local fallback:", error.message);
  }

  // Deterministic local fallback: Hash words to generate a 384-dimensional vector
  return generateDeterministicVector(cleanText);
};

/**
 * Generates a deterministic 384-dimensional unit vector based on text content
 */
function generateDeterministicVector(text) {
  const vector = new Array(384).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  // Simple hashing to distribute words across the 384 dimensions
  words.forEach((word) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = word.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Seed 3 dimensions per word to create some overlapping similarity
    for (let j = 0; j < 3; j++) {
      const index = Math.abs((hash + j * 101) % 384);
      vector[index] += Math.sin(hash + j) * 1.5;
    }
  });

  // Normalize the vector (make it a unit vector) so cosine similarity is just dot product
  let magnitude = 0;
  for (let i = 0; i < 384; i++) {
    magnitude += vector[i] * vector[i];
  }
  magnitude = Math.sqrt(magnitude);

  if (magnitude === 0) {
    // Return a default unit vector
    vector[0] = 1.0;
    return vector;
  }

  return vector.map((val) => val / magnitude);
}

/**
 * Calculate Cosine Similarity between two vectors
 */
export const calculateCosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
