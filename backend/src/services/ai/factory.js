import { LocalAIProvider } from "./localProvider.js";

let activeProvider = null;

/**
 * Returns the configured AI provider instance.
 * By default, this returns the LocalAIProvider (running CPU-bound embeddings and local LLMs).
 */
export const getAIProvider = () => {
  if (!activeProvider) {
    activeProvider = new LocalAIProvider();
  }
  return activeProvider;
};

export default getAIProvider;
