# Build stage
FROM node:lts-alpine AS builder

WORKDIR /app 

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# Start stage

FROM node:lts-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD [ "node", "dist/index.js"]