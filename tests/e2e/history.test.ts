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
  await stagehand.act({ action: "click on the Historial navigation button" });
});

describe("Historial, graficos y tabla", () => {
  test("muestra grafico cuando hay entradas", async () => {
    await seedEntries(5);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    const result = await stagehand.extract({
      instruction: "is there a chart/graph visualization visible on the page?",
      schema: z.object({
        hasChart: z.boolean(),
      }),
    });

    expect(result.hasChart).toBe(true);
  });

  test("cambia tipo de grafico a barras", async () => {
    await seedEntries(3);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "click the bar chart icon button to change to bar chart type" });

    const result = await stagehand.extract({
      instruction: "is the chart now showing bars/columns instead of a line?",
      schema: z.object({
        isBarChart: z.boolean(),
      }),
    });

    expect(result.isBarChart).toBe(true);
  });

  test("cambia tipo de grafico a area", async () => {
    await seedEntries(3);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "click the area chart icon button to change to area chart" });

    const result = await stagehand.extract({
      instruction: "is the chart now showing an area/filled chart?",
      schema: z.object({
        isAreaChart: z.boolean(),
      }),
    });

    expect(result.isAreaChart).toBe(true);
  });

  test("cambia tipo de grafico a dispersion", async () => {
    await seedEntries(3);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "click the scatter/dots chart icon button to change to scatter chart" });

    const result = await stagehand.extract({
      instruction: "is the chart now showing dots/scatter points?",
      schema: z.object({
        isScatterChart: z.boolean(),
      }),
    });

    expect(result.isScatterChart).toBe(true);
  });

  test("cambia metrica del grafico a estres", async () => {
    await seedEntries(3);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "select 'Estres' from the chart metric dropdown" });

    const result = await stagehand.extract({
      instruction: "what metric is currently selected in the chart metric dropdown?",
      schema: z.object({
        selectedMetric: z.string(),
      }),
    });

    expect(result.selectedMetric.toLowerCase()).toContain("estres");
  });

  test("cambia metrica del grafico a horas de sueno", async () => {
    await seedEntries(3);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "select 'Horas de Sueno' from the chart metric dropdown" });

    const result = await stagehand.extract({
      instruction: "what metric is currently selected in the chart metric dropdown?",
      schema: z.object({
        selectedMetric: z.string(),
      }),
    });

    expect(result.selectedMetric.toLowerCase()).toContain("sueno");
  });

  test("vista tabla muestra las columnas correctas", async () => {
    await seedEntry({ intensidad: 7, comida: "arroz", estres: 4 });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });
    await stagehand.act({ action: "click the 'Ver Tabla' button to switch to table view" });

    const result = await stagehand.extract({
      instruction: "extract all the column header names from the table",
      schema: z.object({
        columns: z.array(z.string()),
        hasAccionesColumn: z.boolean(),
      }),
    });

    expect(result.columns.length).toBeGreaterThan(0);
    expect(result.hasAccionesColumn).toBe(true);
  });

  test("vista tabla muestra datos de entrada", async () => {
    await seedEntry({ intensidad: 8, comida: "pasta", ubicacion: "epigastrio" });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });
    await stagehand.act({ action: "click the 'Ver Tabla' button to switch to table view" });

    const result = await stagehand.extract({
      instruction: "extract the data from the first row of the table, including intensity and food values",
      schema: z.object({
        hasData: z.boolean(),
        intensity: z.string(),
        food: z.string(),
      }),
    });

    expect(result.hasData).toBe(true);
  });
});
