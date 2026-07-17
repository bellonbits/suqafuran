FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

RUN npm ci --production --legacy-peer-deps

ENV NEXT_PUBLIC_API_URL=http://localhost:8011/api/v1
ENV NEXT_PUBLIC_APP_NAME=Suqafuran
ENV NEXT_PUBLIC_ENVIRONMENT=production

EXPOSE 3000

CMD ["npm", "start"]
