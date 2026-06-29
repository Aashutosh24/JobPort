import { pipeline } from "@xenova/transformers";

// Lazy-loaded embedding pipeline
let embedder = null;
const getEmbedder = async () => {
  if (!embedder) {
    console.log("📦 Loading local BGE embedding model (Xenova/bge-small-en-v1.5)...");
    embedder = await pipeline("feature-extraction", "Xenova/bge-small-en-v1.5");
  }
  return embedder;
};

export class SemanticMatcherService {
  async generateEmbedding(text) {
    if (!text || typeof text !== "string") {
      return new Array(384).fill(0);
    }

    try {
      const embed = await getEmbedder();
      const output = await embed(text.trim(), { pooling: "mean", normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.warn("⚠️ Local ONNX embedding failed, using deterministic fallback:", error.message);
      return this._generateDeterministicVector(text);
    }
  }

  calculateCosineSimilarity(vecA, vecB) {
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
  }

  _generateDeterministicVector(text) {
    const vector = new Array(384).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = word.charCodeAt(i) + ((hash << 5) - hash);
      }
      for (let j = 0; j < 3; j++) {
        const index = Math.abs((hash + j * 101) % 384);
        vector[index] += Math.sin(hash + j) * 1.5;
      }
    });
    let magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return magnitude === 0 ? [1.0, ...new Array(383).fill(0)] : vector.map(v => v / magnitude);
  }
}
