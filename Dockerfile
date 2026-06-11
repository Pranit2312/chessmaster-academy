FROM node:20-alpine AS client-build
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server-build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server/ server/
COPY --from=client-build /client/build/ client/build/

EXPOSE 5005

ENV NODE_ENV=production
ENV PORT=5005

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5005/health || exit 1

USER node
CMD ["node", "server/server.js"]
