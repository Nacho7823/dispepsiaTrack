import { execSync, spawn, ChildProcess } from "child_process";
import { Stagehand } from "@browserbasehq/stagehand";

const BASE_URL = "http://localhost:5000";
const ROOT = process.cwd();
const PYTHON = `${ROOT}/venv/bin/python3`;

let flaskProcess: ChildProcess | null = null;

function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Server at ${url} did not start within ${timeoutMs}ms`));
      }
      setTimeout(check, 500);
    };
    check();
  });
}

export async function startServer() {
  console.log("\nBuilding frontend...");
  execSync("npm run build", { cwd: ROOT, stdio: "pipe" });

  console.log("Starting Flask server...");
  flaskProcess = spawn(PYTHON, [`${ROOT}/app.py`, "--host", "0.0.0.0", "--port", "5000"], {
    cwd: ROOT,
    stdio: "pipe",
  });

  flaskProcess.stderr?.on("data", (d) => {
    const msg = d.toString();
    if (!msg.includes("WARNING")) process.stderr.write(`[flask] ${msg}`);
  });

  await waitForServer(BASE_URL);
  console.log(`Server ready at ${BASE_URL}\n`);
}

export async function stopServer() {
  if (flaskProcess) {
    flaskProcess.kill("SIGTERM");
    flaskProcess = null;
    console.log("Flask server stopped.");
  }
}

export async function resetData() {
  await fetch(`${BASE_URL}/api/entries`, { method: "DELETE" });
  const defaultSettings = {
    assistantName: "DigestiveBot",
    systemPrompt:
      "Eres DigestiveBot, un asistente de salud especializado en dispepsia funcional. Ayuda al usuario a registrar sus sintomas de forma conversacional.",
    model: "gpt-3.5-turbo",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: "",
  };
  await fetch(`${BASE_URL}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(defaultSettings),
  });
  // Delete all conversations
  const convs = await fetch(`${BASE_URL}/api/conversations`).then((r) => r.json());
  for (const c of convs) {
    await fetch(`${BASE_URL}/api/conversations/${c.id}`, { method: "DELETE" });
  }
}

export async function seedEntry(overrides: Record<string, unknown> = {}) {
  const entry = {
    fecha: new Date().toISOString(),
    sintoma_tipo: ["dolor"],
    intensidad: 7,
    ubicacion: "epigastrio",
    comida: "cafe",
    estres: 5,
    sueno_horas: 6,
    medicacion: "omeprazol",
    notas: "prueba automatizada",
    customField0Value: "",
    customField1Value: "",
    customField2Value: "",
    ...overrides,
  };
  const res = await fetch(`${BASE_URL}/api/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return res.json();
}

export async function seedEntries(count: number) {
  for (let i = 0; i < count; i++) {
    await seedEntry({
      intensidad: Math.floor(Math.random() * 10) + 1,
      estres: Math.floor(Math.random() * 10) + 1,
      sueno_horas: 4 + Math.random() * 6,
      fecha: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }
}

export async function initStagehand(): Promise<Stagehand> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
  const modelName = process.env.STAGEHAND_MODEL || "claude-sonnet-4-20250514";

  if (!apiKey) {
    throw new Error(
      "No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment or .env.test"
    );
  }

  const stagehand = new Stagehand({
    env: "LOCAL",
    modelName,
    modelClientOptions: { apiKey },
    verbose: 0,
  });

  await stagehand.init();
  return stagehand;
}

export { BASE_URL };
