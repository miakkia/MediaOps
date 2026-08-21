FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build


FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production

ARG MEDIAOPS_VERSION=development
ARG MEDIAOPS_BUILD_CHANNEL=local
ARG MEDIAOPS_BUILD_SHA=local

ENV MEDIAOPS_VERSION=${MEDIAOPS_VERSION}
ENV MEDIAOPS_BUILD_CHANNEL=${MEDIAOPS_BUILD_CHANNEL}
ENV MEDIAOPS_BUILD_SHA=${MEDIAOPS_BUILD_SHA}

WORKDIR /app

RUN groupadd --system mediaops \
    && useradd --system --gid mediaops --create-home mediaops

COPY package.json package-lock.json ./

RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=build /app/dist ./dist

RUN mkdir -p /data \
    && chown -R mediaops:mediaops /app /data

USER mediaops

ENV MEDIAOPS_DATA_DIR=/data

CMD ["node", "dist/index.js"]