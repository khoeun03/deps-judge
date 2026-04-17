FROM node:24-alpine AS dev

WORKDIR /app
RUN npm i -g pnpm@10

COPY package.json pnpm-lock.yaml
COPY . .

ENV CI=true
RUN pnpm install --frozen-lockfile

EXPOSE 3000
ENV NODE_ENV=development
CMD ["pnpm", "dev"]

FROM node:24-alpine AS builder

WORKDIR /app
RUN npm i -g pnpm@10

COPY package.json pnpm-lock.yaml
COPY . .

ENV CI=true
RUN pnpm install --frozen-lockfile
RUN pnpm build


FROM node:24-alpine AS prod

WORKDIR /app
RUN npm i -g pnpm@10

COPY --from=builder /app .
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]