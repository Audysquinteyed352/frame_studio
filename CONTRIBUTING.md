# 🤝 Contributing to Frame Studio

Thank you for your interest in contributing to **Frame Studio**! Follow these guidelines to keep the project clean, secure, and professional.

---

## 📂 Repository Layout

- `apps/web`: Next.js 15 frontend application, including all UI views, state, and route handlers.
- `packages/pipeline`: Shared core LLM pipeline (prompt design, schemas, and LLM call clients).
- `packages/remotion-skeleton`: Boilerplate Remotion canvas used as a sandboxed compiler target.
- `workers/render-worker`: Background Node.js compilation and FFmpeg rendering coordinator.

---

## 💡 Code & Architecture Principles

### 1. Accountless Architecture
Do not introduce user authentication tables, session cookies, or user profile records. Frame Studio is fully anonymous and prompt-driven.

### 2. Sandbox Import Safety
Generated code may **only** import from the allowed list:
- `remotion`
- `react`
- `react-dom`
- `@remotion/google-fonts`
- Relative internal files (`./*`)

Any other import must fail static compilation checks.

### 3. Decoupled Processing
Heavy video compilation, bundler assembly, and FFmpeg renders must run exclusively inside the `render-worker` daemon. Keep Next.js routes light and serverless-friendly.

---

## 🛠️ PR Submission Checklist

1. Make sure all TypeScript compilations pass cleanly in the workspace:
   ```bash
   pnpm build
   ```
2. Verify that `pnpm worker` boots up without credentials errors.
3. Test your changes against the render pipeline target:
   ```bash
   pnpm test:render
   ```
