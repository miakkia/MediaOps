FROM node:24-bookworm-slim AS build

WORKDIR /app

# Keep Node 24 while applying security fixes published for the Debian base image.
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npm run build


FROM node:24-bookworm-slim AS runtime

ARG MEDIAOPS_BUILD_SHA=unknown
ARG MEDIAOPS_BUILD_CHANNEL=unknown

ENV NODE_ENV=production
ENV MEDIAOPS_BUILD_SHA=${MEDIAOPS_BUILD_SHA}
ENV MEDIAOPS_BUILD_CHANNEL=${MEDIAOPS_BUILD_CHANNEL}

WORKDIR /app

# Apply available Debian security fixes without moving MediaOps to a new Node major.
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system mediaops \
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
