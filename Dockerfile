FROM node:20.20.2-alpine3.22@sha256:8f47899606d000b0704e992f927fe7335adcd0d6c98851600072fb6e14a13e60

# Rastreabilidade de build (BLOCO V1–V): injetar em CI com --build-arg GIT_COMMIT=<sha>
ARG GIT_COMMIT=
ARG GIT_TAG=
ARG RELEASE_CONTRACT_VERSION=
ARG BUILD_TIMESTAMP=
ENV GIT_COMMIT=${GIT_COMMIT}
ENV GIT_TAG=${GIT_TAG}
ENV RELEASE_CONTRACT_VERSION=${RELEASE_CONTRACT_VERSION}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.version="${GIT_TAG}"

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server-fly.js"]
