import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { initStagehand, startServer, stopServer, resetData, seedEntry, seedEntries, BASE_URL } from "../setup";

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
  await stagehand.act({ action: "click on the Exportar navigation button" });
});

describe("Exportar markdown", () => {
  test("muestra boton de copiar markdown", async () => {
    const result = await stagehand.extract({
      instruction: "extract the text of the main export button",
      schema: z.object({
        buttonText: z.string(),
      }),
    });

    expect(result.buttonText.toLowerCase()).toContain("copiar");
    expect(result.buttonText.toLowerCase()).toContain("markdown");
  });

  test("muestra preview de markdown vacio cuando no hay entradas", async () => {
    const result = await stagehand.extract({
      instruction: "extract the text shown in the markdown preview/code area (dark background section)",
      schema: z.object({
        hasPreview: z.boolean(),
        previewContent: z.string(),
      }),
    });

    expect(result.hasPreview).toBe(true);
  });

  test("genera markdown con datos de entradas", async () => {
    await seedEntry({ intensidad: 6, comida: "ensalada", notas: "ligero malestar" });
    await seedEntry({ intensidad: 9, comida: "pizza", notas: "dolor fuerte" });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Exportar navigation button" });

    const result = await stagehand.extract({
      instruction: "does the markdown preview contain any entry data like intensity values or food names?",
      schema: z.object({
        hasData: z.boolean(),
        containsIntensity: z.boolean(),
      }),
    });

    expect(result.hasData).toBe(true);
  });

  test("muestra feedback 'Copiado' al hacer clic en copiar", async () => {
    await seedEntries(1);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Exportar navigation button" });

    await stagehand.act({ action: "click the 'Copiar Markdown' button" });

    const result = await stagehand.extract({
      instruction: "does the button now show 'Copiado' text?",
      schema: z.object({
        showsCopiado: z.boolean(),
      }),
    });

    expect(result.showsCopiado).toBe(true);
  });

  test("vuelve a mostrar 'Copiar Markdown' despues del feedback", async () => {
    await seedEntries(1);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Exportar navigation button" });

    await stagehand.act({ action: "click the 'Copiar Markdown' button" });
    // Wait for the 2s timeout to expire
    await new Promise((r) => setTimeout(r, 2500));

    const result = await stagehand.extract({
      instruction: "does the button text say 'Copiar Markdown' again?",
      schema: z.object({
        resetToOriginal: z.boolean(),
      }),
    });

    expect(result.resetToOriginal).toBe(true);
  });
});
