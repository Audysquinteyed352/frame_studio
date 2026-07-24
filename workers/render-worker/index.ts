import express from "express";
import cors from "cors";
import { renderComposition } from "./render.js";
import { compileCode } from "./compile.js";
import path from "node:path";
import fs from "node:fs";

interface QueueJob<T> {
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  position: number;
}

class RenderQueue {
  private activeCount = 0;
  private readonly pending: Array<QueueJob<any>> = [];

  constructor(
    private readonly concurrency: number,
    private readonly maxPending: number
  ) {}

  enqueue<T>(task: () => Promise<T>): { promise: Promise<T>; position: number } {
    const position = this.activeCount > 0 ? this.pending.length + 2 : this.pending.length + 1;
    if (this.pending.length >= this.maxPending) {
      return { promise: Promise.reject(new Error("Render queue is full")), position };
    }

    let resolveFn!: (value: T | PromiseLike<T>) => void;
    let rejectFn!: (reason?: unknown) => void;

    const promise = new Promise<T>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
      this.pending.push({ task, resolve: resolveFn, reject: rejectFn, position });
      this.processNext();
    });

    return { promise, position };
  }

  private processNext(): void {
    if (this.activeCount >= this.concurrency || this.pending.length === 0) {
      return;
    }

    const job = this.pending.shift()!;
    this.activeCount += 1;

    job.task()
      .then((result) => job.resolve(result))
      .catch((error) => job.reject(error))
      .finally(() => {
        this.activeCount -= 1;
        this.processNext();
      });
  }

  get active() {
    return this.activeCount;
  }

  get pendingCount() {
    return this.pending.length;
  }
}

const renderQueue = new RenderQueue(
  Number(process.env.RENDER_QUEUE_CONCURRENCY ?? 1),
  Number(process.env.RENDER_QUEUE_MAX_PENDING ?? 10)
);

const app = express();
app.use(express.json({ limit: "50mb" }));

// CORS: allow the web origin (set WEB_ORIGIN) or allow any origin for testing
app.use(
  cors({
    origin: process.env.WEB_ORIGIN ? process.env.WEB_ORIGIN.split(",") : "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Queue-Position", "X-Queue-First", "X-Queue-Active", "X-Queue-Pending"],
  })
);

function resolveSkeletonDir() {
  const configured = process.env.SKELETON_DIR?.trim();
  if (configured && fs.existsSync(configured)) {
    return configured;
  }

  const candidates = [
    path.resolve(process.cwd(), "../packages/remotion-skeleton"),
    path.resolve(process.cwd(), "../../packages/remotion-skeleton"),
    path.resolve(process.cwd(), "packages/remotion-skeleton"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not locate packages/remotion-skeleton. Checked: ${candidates.join(", ")}`
  );
}

app.post("/render", async (req, res) => {
  try {
    const files = req.body.files;
    if (!files || typeof files !== "object") {
      return res.status(400).json({ error: "Missing or invalid files payload." });
    }

    const skeletonDir = resolveSkeletonDir();

    const { promise, position } = renderQueue.enqueue(async () => {
      const compileResult = await compileCode(files, skeletonDir);
      if (!compileResult.ok || !compileResult.projectDir) {
        throw new Error(compileResult.error || "Compilation failed.");
      }

      return renderComposition(compileResult.projectDir);
    });

    const isFirst = position === 1;
    res.setHeader("X-Queue-Position", String(position));
    res.setHeader("X-Queue-First", String(isFirst));
    res.setHeader("X-Queue-Active", String(renderQueue.active));
    res.setHeader("X-Queue-Pending", String(renderQueue.pendingCount));
    res.flushHeaders();

    const result = await promise;

    return res.json({
      mp4: result.videoBuffer.toString("base64"),
      durationSeconds: result.durationSeconds,
      queue: {
        active: renderQueue.active,
        pending: renderQueue.pendingCount,
      },
    });
  } catch (err: any) {
    console.error("[Render Worker] Error:", err);
    if (err?.message === "Render queue is full") {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: err?.message || "Worker error" });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`[Render Worker] Listening on port ${port}`);
});
