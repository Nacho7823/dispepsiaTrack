import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    sequence: {
      concurrent: false,
    },
    fileParallelism: false,
    globals: true,
    env: {
      // Stagehand will use ANTHROPIC_API_KEY or OPENAI_API_KEY from environment
      // Set these in your shell or in .env.test before running
      STAGEHAND_MODEL: process.env.STAGEHAND_MODEL || "claude-sonnet-4-20250514",
    },
  },
});
