# Render Worker

This worker exposes a simple `/render` HTTP endpoint that accepts generated Remotion project files and returns a base64-encoded MP4.

## Install

```bash
pnpm --dir workers/render-worker install
```

## Development

```bash
pnpm --dir workers/render-worker dev
```

## Environment

- `PORT` - optional, defaults to `3001`
- `SKELETON_DIR` - optional path to the `packages/remotion-skeleton` directory when the repo is mounted elsewhere

## Build

```bash
pnpm --dir workers/render-worker build
```

## Run

```bash
pnpm --dir workers/render-worker start
```

## Environment

- `PORT` - optional, defaults to `3001`
