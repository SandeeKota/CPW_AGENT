import "dotenv/config";

const config = {
  MONGO_URI: process.env.MONGO_URI || "",
  PORT: process.env.PORT || 4000,
  DB_NAME: process.env.DB_NAME || "",
  // OpenAI — used ONLY for embeddings (Pinecone vector store)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o",
  OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large",
  NODE_ENV: process.env.NODE_ENV || "development",
  cognito: {
    USERPOOL_ID: process.env.USERPOOL_ID || "",
    USERPOOL_APP_CLIENT_ID: process.env.USERPOOL_APP_CLIENT_ID || "",
  },
  pinecone: {
    API_KEY: process.env.PINECONE_API_KEY || "",
    INDEX_NAME: process.env.PINECONE_INDEX_NAME || "cpw-knowledge-base",
  },
  // Sarvam AI — used for all LLM chat/completion calls
  sarvam: {
    API_KEY: process.env.SARVAM_API_KEY || "",
    MODEL: process.env.SARVAM_MODEL || "sarvam-m",
    BASE_URL: process.env.SARVAM_BASE_URL || "https://api.sarvam.ai/v1",
  },
  SCHEMA_API_URL: process.env.SCHEMA_API_URL || "http://localhost:3000/api/v1/agent/schemas",
};

const requiredEnvs = ["MONGO_URI", "OPENAI_API_KEY", "SARVAM_API_KEY", "USERPOOL_ID", "PINECONE_API_KEY"];
const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

if (missingEnvs.length > 0) {
  console.warn(
    `⚠️ WARNING: Missing critical environment variables: ${missingEnvs.join(", ")}`
  );
  console.warn("Please create a .env file and set these variables.");
}

export default config;
