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

describe("CRUD de entradas", () => {
  test("muestra estado vacio cuando no hay entradas", async () => {
    await stagehand.act({ action: "click on the Historial navigation button" });

    const result = await stagehand.extract({
      instruction: "extract the empty state message text shown when there are no records",
      schema: z.object({
        message: z.string(),
      }),
    });

    expect(result.message.toLowerCase()).toContain("sin");
  });

  test("muestra entradas despues de seedear datos", async () => {
    await seedEntries(3);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    const result = await stagehand.extract({
      instruction: "count how many entry items are visible in the history list or table",
      schema: z.object({
        count: z.number(),
        hasEntries: z.boolean(),
      }),
    });

    expect(result.hasEntries).toBe(true);
    expect(result.count).toBe(3);
  });

  test("abre el modal de edicion al hacer clic en editar", async () => {
    await seedEntry({ sintoma_tipo: ["ardor"], intensidad: 8 });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "click the edit button for the first entry" });

    const result = await stagehand.extract({
      instruction: "extract the modal title and the intensity value shown in the edit form",
      schema: z.object({
        modalTitle: z.string(),
        intensidad: z.string(),
      }),
    });

    expect(result.modalTitle).toContain("Editar");
    expect(result.intensidad).toContain("8");
  });

  test("edita una entrada y guarda los cambios", async () => {
    await seedEntry({ intensidad: 3, notas: "nota original" });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });
    await stagehand.act({ action: "click the edit button for the first entry" });

    await stagehand.act({ action: "clear the notas field and type 'nota actualizada por test'" });
    await stagehand.act({ action: "click the Guardar button to save the entry" });

    const result = await stagehand.extract({
      instruction: "check if the entry now shows the updated notas value 'nota actualizada por test'",
      schema: z.object({
        foundUpdatedNote: z.boolean(),
      }),
    });

    expect(result.foundUpdatedNote).toBe(true);
  });

  test("cancela la edicion sin guardar cambios", async () => {
    await seedEntry({ notas: "nota original sin cambios" });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });
    await stagehand.act({ action: "click the edit button for the first entry" });

    await stagehand.act({ action: "clear the notas field and type 'esto no deberia guardarse'" });
    await stagehand.act({ action: "click the Cancelar button to cancel editing" });

    const result = await stagehand.extract({
      instruction: "is the original note 'nota original sin cambios' still visible in the entry?",
      schema: z.object({
        originalPreserved: z.boolean(),
      }),
    });

    expect(result.originalPreserved).toBe(true);
  });

  test("elimina una entrada", async () => {
    await seedEntry({ notas: "entrada para eliminar" });
    await seedEntry({ notas: "entrada que debe permanecer" });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "click the delete button for the first entry" });

    const result = await stagehand.extract({
      instruction: "how many entries are visible now? Is the 'entrada para eliminar' gone?",
      schema: z.object({
        remainingCount: z.number(),
        deletedGone: z.boolean(),
      }),
    });

    expect(result.deletedGone).toBe(true);
    expect(result.remainingCount).toBe(1);
  });

  test("cambia entre vista lista y tabla", async () => {
    await seedEntries(2);
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "click the 'Ver Tabla' button to switch to table view" });

    const result = await stagehand.extract({
      instruction: "is a table visible with column headers? Extract the column names.",
      schema: z.object({
        isTableView: z.boolean(),
        columns: z.array(z.string()),
      }),
    });

    expect(result.isTableView).toBe(true);
    expect(result.columns.length).toBeGreaterThan(0);

    await stagehand.act({ action: "click the 'Ver Lista' button to switch back to list view" });
  });

  test("expande una entrada en vista lista para ver detalles", async () => {
    await seedEntry({ intensidad: 9, comida: "pizza", notas: "dolor fuerte" });
    await stagehand.page.reload();
    await stagehand.act({ action: "click on the Historial navigation button" });

    await stagehand.act({ action: "click the expand/collapse button on the first entry to see its details" });

    const result = await stagehand.extract({
      instruction: "extract the detailed entry information that is now expanded, including intensidad, comida, and notas",
      schema: z.object({
        intensidad: z.string(),
        comida: z.string(),
        notas: z.string(),
      }),
    });

    expect(result.intensidad).toContain("9");
    expect(result.comida.toLowerCase()).toContain("pizza");
    expect(result.notas.toLowerCase()).toContain("dolor");
  });
});
