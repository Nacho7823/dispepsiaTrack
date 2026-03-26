import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { initStagehand, startServer, stopServer, resetData, seedEntries, BASE_URL } from "../setup";

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
  await stagehand.act({ action: "click on the Ajustes navigation button" });
});

describe("Pantalla de ajustes", () => {
  test("muestra seccion de IA Asistente con nombre", async () => {
    const result = await stagehand.extract({
      instruction: "extract the assistant name shown in the IA Asistente section",
      schema: z.object({
        assistantName: z.string(),
      }),
    });

    expect(result.assistantName).toBeTruthy();
  });

  test("cambia el nombre del asistente", async () => {
    await stagehand.act({ action: "clear the assistant name field and type 'MiBot'" });

    const result = await stagehand.extract({
      instruction: "what is the current value in the assistant name input field?",
      schema: z.object({
        name: z.string(),
      }),
    });

    expect(result.name).toContain("MiBot");
  });

  test("muestra seccion de configuracion API con URL y API Key", async () => {
    const result = await stagehand.extract({
      instruction: "extract the section title and whether there are input fields for API URL and API Key",
      schema: z.object({
        hasApiSection: z.boolean(),
        hasUrlField: z.boolean(),
        hasKeyField: z.boolean(),
      }),
    });

    expect(result.hasApiSection).toBe(true);
    expect(result.hasUrlField).toBe(true);
    expect(result.hasKeyField).toBe(true);
  });

  test("muestra boton 'Obtener Modelos'", async () => {
    const result = await stagehand.extract({
      instruction: "is there an 'Obtener Modelos' button? Is it enabled or disabled?",
      schema: z.object({
        hasButton: z.boolean(),
        isEnabled: z.boolean(),
      }),
    });

    expect(result.hasButton).toBe(true);
  });

  test("agrega un campo personalizado", async () => {
    await stagehand.act({ action: "click the 'Agregar Campo Personalizado' button in the Campos de la Tabla section" });

    const result = await stagehand.extract({
      instruction: "how many custom field input fields are now visible in the Campos de la Tabla section?",
      schema: z.object({
        count: z.number(),
      }),
    });

    expect(result.count).toBeGreaterThanOrEqual(1);
  });

  test("edita un campo personalizado", async () => {
    await stagehand.act({ action: "click the 'Agregar Campo Personalizado' button" });
    await stagehand.act({ action: "type 'Ejercicio' in the new custom field input" });

    const result = await stagehand.extract({
      instruction: "what value is in the custom field input?",
      schema: z.object({
        value: z.string(),
      }),
    });

    expect(result.value.toLowerCase()).toContain("ejercicio");
  });

  test("elimina un campo personalizado", async () => {
    await stagehand.act({ action: "click the 'Agregar Campo Personalizado' button" });
    await stagehand.act({ action: "type 'Temporal' in the custom field input" });

    await stagehand.act({ action: "click the trash remove button next to the custom field" });

    const result = await stagehand.extract({
      instruction: "how many custom field inputs remain in the Campos de la Tabla section?",
      schema: z.object({
        count: z.number(),
      }),
    });

    expect(result.count).toBe(0);
  });

  test("muestra seccion unificada de campos de la tabla", async () => {
    const result = await stagehand.extract({
      instruction: "is there a 'Campos de la Tabla' section? How many field rows are visible?",
      schema: z.object({
        hasSection: z.boolean(),
        fieldCount: z.number(),
      }),
    });

    expect(result.hasSection).toBe(true);
    expect(result.fieldCount).toBeGreaterThan(0);
  });

  test("agrega un campo personalizado a la lista", async () => {
    const before = await stagehand.extract({
      instruction: "how many field rows are in the Campos de la Tabla section?",
      schema: z.object({ count: z.number() }),
    });

    await stagehand.act({ action: "click the 'Agregar Campo Personalizado' button" });

    const after = await stagehand.extract({
      instruction: "how many field rows are in the Campos de la Tabla section now?",
      schema: z.object({ count: z.number() }),
    });

    expect(after.count).toBe(before.count + 1);
  });

  test("muestra textarea de system prompt", async () => {
    const result = await stagehand.extract({
      instruction: "is there a System Prompt textarea section? Extract part of its content.",
      schema: z.object({
        hasSystemPrompt: z.boolean(),
        content: z.string(),
      }),
    });

    expect(result.hasSystemPrompt).toBe(true);
    expect(result.content.length).toBeGreaterThan(0);
  });

  test("muestra boton 'Eliminar Historial'", async () => {
    const result = await stagehand.extract({
      instruction: "is there an 'Eliminar Historial' button at the bottom of the settings page?",
      schema: z.object({
        hasDeleteButton: z.boolean(),
      }),
    });

    expect(result.hasDeleteButton).toBe(true);
  });

  test("elimina todo el historial con confirmacion", async () => {
    await seedEntries(3);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Ajustes navigation button" });

    stagehand.page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await stagehand.act({ action: "click the 'Eliminar Historial' button" });

    await stagehand.act({ action: "click on the Historial navigation button" });

    const result = await stagehand.extract({
      instruction: "is the history empty? Is there a 'Sin registros' message?",
      schema: z.object({
        isEmpty: z.boolean(),
      }),
    });

    expect(result.isEmpty).toBe(true);
  });
});
