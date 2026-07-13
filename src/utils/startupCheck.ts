import config from "../config/config";
import logger from "./logger";

// ==========================================
// Startup API Key Validator
// ==========================================

/**
 * Tests Sarvam AI connectivity by sending a minimal chat completion request.
 * Returns true if the key is valid, false otherwise.
 */
async function validateSarvamKey(): Promise<boolean> {
  try {
    const response = await fetch(`${config.sarvam.BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.sarvam.API_KEY}`,
      },
      body: JSON.stringify({
        model: config.sarvam.MODEL,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });

    if (response.status === 401 || response.status === 403) {
      logger.error(`Sarvam API key is invalid or unauthorized (HTTP ${response.status}). Check SARVAM_API_KEY in .env`);
      return false;
    }

    if (response.status === 429) {
      // Key is valid but rate limited — treat as success
      logger.warn(`Sarvam API key is valid but rate limited (HTTP 429). Proceeding.`);
      return true;
    }

    if (!response.ok) {
      const body = await response.text();
      logger.error(`Sarvam API returned unexpected error (HTTP ${response.status}): ${body.slice(0, 200)}`);
      return false;
    }

    logger.info(`Sarvam AI key validated successfully | model: ${config.sarvam.MODEL}`);
    return true;
  } catch (err: any) {
    logger.error(`Sarvam API reachability check failed: ${err.message}`);
    return false;
  }
}

/**
 * Tests OpenAI connectivity (used for embeddings) by calling the embeddings endpoint.
 */
async function validateOpenAIKey(): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.OPENAI_EMBEDDING_MODEL,
        input: "ping",
      }),
    });

    if (response.status === 401 || response.status === 403) {
      logger.error(`OpenAI API key is invalid or unauthorized (HTTP ${response.status}). Check OPENAI_API_KEY in .env`);
      return false;
    }

    if (response.status === 429) {
      logger.warn(`OpenAI API key is valid but rate limited (HTTP 429). Proceeding.`);
      return true;
    }

    if (!response.ok) {
      const body = await response.text();
      logger.error(`OpenAI API returned unexpected error (HTTP ${response.status}): ${body.slice(0, 200)}`);
      return false;
    }

    logger.info(`OpenAI API key validated successfully | model: ${config.OPENAI_EMBEDDING_MODEL}`);
    return true;
  } catch (err: any) {
    logger.error(`OpenAI API reachability check failed: ${err.message}`);
    return false;
  }
}

/**
 * Run all startup API key checks. Logs a clear summary.
 * Server continues regardless — keys may become valid after restart.
 */
export async function runStartupChecks(): Promise<void> {
  logger.info("Running startup API key checks...");

  const [sarvamOk, openAiOk] = await Promise.all([
    validateSarvamKey(),
    validateOpenAIKey(),
  ]);

  if (sarvamOk && openAiOk) {
    logger.info("All API keys validated — agent is ready.");
  } else {
    if (!sarvamOk) {
      logger.warn("Sarvam AI key check FAILED — LLM calls will not work until SARVAM_API_KEY is fixed.");
    }
    if (!openAiOk) {
      logger.warn("OpenAI key check FAILED — Pinecone embedding/search will not work until OPENAI_API_KEY is fixed.");
    }
    logger.warn("Server is running but some features may be unavailable.");
  }
}
