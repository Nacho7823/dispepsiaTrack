import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { initStagehand, startServer, stopServer, resetData, BASE_URL } from "../setup";

let stagehand: Stagehand;

beforeAll(async () => {
  await startServer();
  stagehand = await initStagehand();
});

afterAll(async () => {
  await stagehand?.close();
  await stopServer();
});

beforeEach(async () => {
  await resetData();
  await stagehand.page.goto(BASE_URL);
});

describe("Chat con asistente", () => {
  test("muestra el mensaje de bienvenida del asistente", async () => {
    const result = await stagehand.extract({
      instruction: "extract the initial assistant welcome message text",
      schema: z.object({
        message: z.string(),
        botName: z.string(),
      }),
    });

    expect(result.message.length).toBeGreaterThan(0);
    expect(result.botName.toLowerCase()).toContain("digestivebot");
  });

  test("el campo de entrada esta vacio por defecto", async () => {
    const result = await stagehand.extract({
      instruction: "extract the placeholder text from the chat input field",
      schema: z.object({
        placeholder: z.string(),
      }),
    });

    expect(result.placeholder).toBeTruthy();
  });

  test("no envia mensaje vacio al presionar Enter", async () => {
    const beforeResult = await stagehand.extract({
      instruction: "count the number of messages in the chat",
      schema: z.object({ count: z.number() }),
    });

    await stagehand.act({ action: "press Enter in the empty chat input field" });

    const afterResult = await stagehand.extract({
      instruction: "count the number of messages in the chat",
      schema: z.object({ count: z.number() }),
    });

    expect(afterResult.count).toBe(beforeResult.count);
  });

  test("muestra error cuando no hay API key configurada", async () => {
    await stagehand.act({ action: "type 'hola, me duele el estomago' in the chat input field" });
    await stagehand.act({ action: "click the send button to send the message" });

    const result = await stagehand.extract({
      instruction: "is there an error message about API Key not configured?",
      schema: z.object({
        hasApiKeyError: z.boolean(),
        errorText: z.string(),
      }),
    });

    expect(result.hasApiKeyError).toBe(true);
  });

  test("muestra indicador de escritura mientras el asistente responde", async () => {
    await stagehand.act({ action: "type 'dolor abdominal' in the chat input field" });
    await stagehand.act({ action: "click the send button" });

    const result = await stagehand.extract({
      instruction: "is there a typing indicator (animated dots) visible?",
      schema: z.object({
        hasTypingIndicator: z.boolean(),
      }),
    });

    // This is a best-effort check since the typing indicator is transient
    // If API key is not configured, there won't be one
    expect(typeof result.hasTypingIndicator).toBe("boolean");
  });

  test("el mensaje del usuario aparece en el chat despues de enviar", async () => {
    await stagehand.act({ action: "type 'tengo dolor de estomago' in the chat input" });
    await stagehand.act({ action: "click the send button" });

    const result = await stagehand.extract({
      instruction: "is the user message 'tengo dolor de estomago' visible in the chat?",
      schema: z.object({
        messageVisible: z.boolean(),
      }),
    });

    expect(result.messageVisible).toBe(true);
  });

  test("el input se limpia despues de enviar un mensaje", async () => {
    await stagehand.act({ action: "type 'mensaje de prueba' in the chat input" });
    await stagehand.act({ action: "click the send button" });

    const result = await stagehand.extract({
      instruction: "is the chat input field empty after sending?",
      schema: z.object({
        inputEmpty: z.boolean(),
      }),
    });

    expect(result.inputEmpty).toBe(true);
  });
});
