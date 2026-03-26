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
});

describe("Casos limite y errores", () => {
  test("renderiza la aplicacion correctamente sin datos", async () => {
    const result = await stagehand.extract({
      instruction: "extract the app title 'Dispepsia' and 'Tracker' text from the navigation header",
      schema: z.object({
        title: z.string(),
        subtitle: z.string(),
        hasNavigation: z.boolean(),
      }),
    });

    expect(result.title).toContain("Dispepsia");
    expect(result.subtitle.toLowerCase()).toContain("tracker");
    expect(result.hasNavigation).toBe(true);
  });

  test("muestra todas las 4 pestañas de navegacion", async () => {
    const result = await stagehand.extract({
      instruction: "extract all the navigation tab names visible in the sidebar",
      schema: z.object({
        tabs: z.array(z.string()),
      }),
    });

    expect(result.tabs.length).toBe(4);
    expect(result.tabs.some((t) => t.toLowerCase().includes("asistente"))).toBe(true);
    expect(result.tabs.some((t) => t.toLowerCase().includes("historial"))).toBe(true);
    expect(result.tabs.some((t) => t.toLowerCase().includes("exportar"))).toBe(true);
    expect(result.tabs.some((t) => t.toLowerCase().includes("ajustes"))).toBe(true);
  });

  test("historial con una sola entrada no rompe el grafico", async () => {
    await seedEntry({ intensidad: 5 });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    const result = await stagehand.extract({
      instruction: "is the chart visible and rendering correctly with just one data point?",
      schema: z.object({
        chartVisible: z.boolean(),
        noError: z.boolean(),
      }),
    });

    expect(result.chartVisible).toBe(true);
    expect(result.noError).toBe(true);
  });

  test("historial con muchas entradas (10) carga sin error", async () => {
    await seedEntries(10);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    const result = await stagehand.extract({
      instruction: "how many entries are visible in the history list? Is the page loaded without errors?",
      schema: z.object({
        count: z.number(),
        loadedSuccessfully: z.boolean(),
      }),
    });

    expect(result.count).toBe(10);
    expect(result.loadedSuccessfully).toBe(true);
  });

  test("exportar con muchas entradas genera markdown completo", async () => {
    await seedEntries(10);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Exportar navigation button" });

    const result = await stagehand.extract({
      instruction: "does the markdown preview show data for multiple entries? Is it a long text?",
      schema: z.object({
        hasMultipleEntries: z.boolean(),
        isLongText: z.boolean(),
      }),
    });

    expect(result.hasMultipleEntries).toBe(true);
  });

  test("mensaje largo en el chat no rompe la interfaz", async () => {
    const longMessage =
      "Hoy me desperte con un dolor muy fuerte en la parte superior del abdomen, " +
      "despues de cenar pizza con refresco anoche. El dolor empeora cuando me acuesto " +
      "y mejora un poco cuando camino. Tambien siento nauseas y algo de acidez.";

    await stagehand.act({ action: `type '${longMessage}' in the chat input` });
    await stagehand.act({ action: "click the send button" });

    const result = await stagehand.extract({
      instruction: "is the long user message visible in the chat? Is the layout intact?",
      schema: z.object({
        messageVisible: z.boolean(),
        layoutIntact: z.boolean(),
      }),
    });

    expect(result.messageVisible).toBe(true);
    expect(result.layoutIntact).toBe(true);
  });

  test("editar entrada con todos los campos vacios", async () => {
    await seedEntry({
      notas: "",
      comida: "",
      ubicacion: "",
      medicacion: "",
    });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });
    await stagehand.act({ action: "click the edit button for the first entry" });

    const result = await stagehand.extract({
      instruction: "is the edit modal open with form fields visible, even with empty values?",
      schema: z.object({
        modalOpen: z.boolean(),
        fieldsVisible: z.boolean(),
      }),
    });

    expect(result.modalOpen).toBe(true);
    expect(result.fieldsVisible).toBe(true);

    await stagehand.act({ action: "click the Cancelar button" });
  });

  test("navegacion rapida entre pestañas no rompe la app", async () => {
    await stagehand.act({ action: "click on the Historial navigation button" });
    await stagehand.act({ action: "click on the Exportar navigation button" });
    await stagehand.act({ action: "click on the Ajustes navigation button" });
    await stagehand.act({ action: "click on the Asistente navigation button" });

    const result = await stagehand.extract({
      instruction: "is the Asistente chat screen visible and functional after rapid navigation?",
      schema: z.object({
        chatVisible: z.boolean(),
        noErrors: z.boolean(),
      }),
    });

    expect(result.chatVisible).toBe(true);
    expect(result.noErrors).toBe(true);
  });

  test("recargar la pagina mantiene la funcionalidad", async () => {
    await seedEntries(2);
    await stagehand.page.reload();

    const result = await stagehand.extract({
      instruction: "after page reload, is the app still functional? Can you see the navigation tabs?",
      schema: z.object({
        appFunctional: z.boolean(),
        hasNavigation: z.boolean(),
      }),
    });

    expect(result.appFunctional).toBe(true);
    expect(result.hasNavigation).toBe(true);
  });
});
