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

describe("Gestion de conversaciones", () => {
  test("muestra estado vacio cuando no hay conversaciones", async () => {
    const result = await stagehand.extract({
      instruction: "look at the conversation sidebar. Is there a message saying there are no conversations?",
      schema: z.object({
        hasEmptyState: z.boolean(),
        emptyText: z.string(),
      }),
    });

    expect(result.hasEmptyState).toBe(true);
  });

  test("muestra boton de nueva conversacion", async () => {
    const result = await stagehand.extract({
      instruction: "is there a 'Nueva conversacion' button in the sidebar?",
      schema: z.object({
        hasNewButton: z.boolean(),
        buttonText: z.string(),
      }),
    });

    expect(result.hasNewButton).toBe(true);
    expect(result.buttonText.toLowerCase()).toContain("nueva");
  });

  test("crea una nueva conversacion", async () => {
    await stagehand.act({ action: "click the 'Nueva conversacion' button in the sidebar" });

    const result = await stagehand.extract({
      instruction: "is a new conversation now visible in the sidebar? How many conversations are listed?",
      schema: z.object({
        hasConversation: z.boolean(),
        count: z.number(),
      }),
    });

    expect(result.hasConversation).toBe(true);
    expect(result.count).toBeGreaterThanOrEqual(1);
  });

  test("elimina una conversacion", async () => {
    await stagehand.act({ action: "click the 'Nueva conversacion' button" });
    await stagehand.act({ action: "click the 'Nueva conversacion' button again to create a second conversation" });

    const before = await stagehand.extract({
      instruction: "how many conversations are in the sidebar?",
      schema: z.object({ count: z.number() }),
    });

    await stagehand.act({ action: "click the delete button on the first conversation in the sidebar" });

    const after = await stagehand.extract({
      instruction: "how many conversations are in the sidebar now?",
      schema: z.object({ count: z.number() }),
    });

    expect(after.count).toBe(before.count - 1);
  });

  test("carga una conversacion al hacer clic en ella", async () => {
    await stagehand.act({ action: "click the 'Nueva conversacion' button" });

    await stagehand.extract({
      instruction: "is the new conversation now highlighted/selected in the sidebar?",
      schema: z.object({
        isSelected: z.boolean(),
      }),
    });
  });

  test("sidebar de conversaciones es visible en escritorio", async () => {
    const result = await stagehand.extract({
      instruction: "is the conversation sidebar panel visible on the left side of the chat area?",
      schema: z.object({
        sidebarVisible: z.boolean(),
      }),
    });

    expect(result.sidebarVisible).toBe(true);
  });
});
