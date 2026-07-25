# Contributing to Frame Studio

## Project Structure

```
apps/web/                  Next.js 15 app (Vercel)
├── app/api/generate/route.ts    AI pipeline + compile endpoint
├── app/page.tsx                 Client UI + browser render trigger
├── components/                  UI components
├── lib/
│   ├── compile.ts               Server: TS check + TSX→JS via esbuild
│   ├── renderInBrowser.ts       Client: evaluates compiled code + renders MP4
│   └── apiKey.ts                API key cookie helpers
packages/pipeline/               Shared AI pipeline (plan, codegen, fix)
packages/remotion-skeleton/      Template Remotion canvas project
```

## Architecture

- **Server** (Next.js API route, runs on Vercel free tier):
  1. Plan: Gemini creates video structure from prompt
  2. Codegen: Gemini writes React/Remotion code
  3. Compile: TypeScript validation + fix loop (up to 3 retries)
  4. esbuild transforms TSX→JS (CJS format)
  5. Returns `{ compiledFiles, metadata }` as JSON

- **Client** (Browser, no server needed for render):
  1. Receives compiled CJS code
  2. Evaluates via `new Function()` with a custom `require()` shim
  3. `@remotion/web-renderer` renders MP4 using WebCodecs API
  4. Downloads directly — no queue, no infrastructure

## Import Safety

Generated code may **only** import from:
- `remotion`
- `react`
- `react-dom`
- `@remotion/google-fonts` (and subpaths like `@remotion/google-fonts/Inter`)
- Relative files (`./Scene1`, `../helpers`, etc.)

The server rejects any code with disallowed imports. This is enforced by `validateStaticImports()` in `lib/compile.ts`.

## Client-Side Module Resolution

The generated code is compiled to CJS by esbuild on the server. On the client, `renderInBrowser.ts` provides a CJS shim:

- `require("remotion")` → maps to the actual `remotion` module (imported in the page)
- `require("./Scene1")` → resolves to `src/Scene1.tsx` in the compiled files map
- `require("@remotion/google-fonts/Inter")` → shim that returns `{ fontFamily: "Inter" }`

## PR Checklist

1. `pnpm build` — full production build must pass
2. `pnpm dev` — dev server must start without errors
3. No stale references to old render-worker, Lambda, or RENDER_WORKER_URL
4. Verify browser rendering works in Chrome 94+ / Firefox 130+
