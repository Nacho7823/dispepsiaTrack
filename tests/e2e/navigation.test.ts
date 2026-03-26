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

describe("Navegacion entre pestañas", () => {
  test("carga la aplicacion y muestra la pestaña Asistente por defecto", async () => {
    const result = await stagehand.extract({
      instruction: "extract the visible tab name and the welcome message from the chat",
      schema: z.object({
        activeTab: z.string(),
        welcomeMessage: z.string(),
      }),
    });

    expect(result.activeTab.toLowerCase()).toContain("asistente");
    expect(result.welcomeMessage.length).toBeGreaterThan(0);
  });

  test("navega a la pestaña Historial", async () => {
    await stagehand.act({ action: "click on the Historial navigation button" });

    const result = await stagehand.extract({
      instruction: "extract what screen is visible. Is it showing history/records or an empty state?",
      schema: z.object({
        screen: z.string(),
        isEmpty: z.boolean(),
      }),
    });

    expect(result.screen).toBeTruthy();
  });

  test("navega a la pestaña Exportar", async () => {
    await stagehand.act({ action: "click on the Exportar navigation button" });

    const result = await stagehand.extract({
      instruction: "extract the text on the main export button and whether there is a code/markdown preview area",
      schema: z.object({
        buttonText: z.string(),
        hasPreview: z.boolean(),
      }),
    });

    expect(result.buttonText.toLowerCase()).toContain("copiar");
  });

  test("navega a la pestaña Ajustes", async () => {
    await stagehand.act({ action: "click on the Ajustes navigation button" });

    const result = await stagehand.extract({
      instruction: "extract the settings section headings visible on the page",
      schema: z.object({
        sections: z.array(z.string()),
      }),
    });

    expect(result.sections.length).toBeGreaterThanOrEqual(3);
    expect(result.sections.some((s) => s.toLowerCase().includes("api"))).toBe(true);
  });

  test("vuelve a Asistente despues de visitar otra pestaña", async () => {
    await stagehand.act({ action: "click on the Historial navigation button" });
    await stagehand.act({ action: "click on the Asistente navigation button" });

    const result = await stagehand.extract({
      instruction: "is the chat assistant visible with a message input field?",
      schema: z.object({
        hasChatInput: z.boolean(),
        assistantVisible: z.boolean(),
      }),
    });

    expect(result.hasChatInput).toBe(true);
  });
});
