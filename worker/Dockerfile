# Scan worker image. Build from the repository root so the engine (livechecks)
# and worker share one context:
#   docker build -f worker/Dockerfile -t livecheck-worker .
#
# The Playwright base is pinned to the version in package-lock.json (1.62.1) so
# the bundled browser matches the library the engine launches.
FROM mcr.microsoft.com/playwright:v1.62.1-noble

# 1) Build the engine library from the repo root.
WORKDIR /app
COPY package.json package-lock.json tsup.config.ts tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build

# 2) Install + build the worker (livechecks resolves via file:.. to /app).
COPY worker ./worker
WORKDIR /app/worker
RUN npm install && npm run build

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
