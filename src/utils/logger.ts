import config from "../config/config";

const isDev = config.NODE_ENV === "development";

const timestamp = () => new Date().toISOString();

const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[${timestamp()}] ℹ️  ${message}`, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[${timestamp()}] ⚠️  ${message}`, ...args);
  },

  error: (message: string, ...args: any[]) => {
    console.error(`[${timestamp()}] ❌ ${message}`, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    if (isDev) {
      console.debug(`[${timestamp()}] 🐛 ${message}`, ...args);
    }
  },

  agent: (message: string, ...args: any[]) => {
    console.log(`[${timestamp()}] 🤖 ${message}`, ...args);
  },
};

export default logger;
