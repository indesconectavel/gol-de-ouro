FROM node:20-alpine

# Rastreabilidade de build (BLOCO V1–V): injetar em CI com --build-arg GIT_COMMIT=<sha>
ARG GIT_COMMIT=
ENV GIT_COMMIT=${GIT_COMMIT}
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server-fly.js"]
