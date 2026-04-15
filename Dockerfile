#   Stage 1: Build builder stage (1st stage)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Use legacy-peer-deps to advoid dependency conflict issues. (Nest 11 with BullMQ and NodeMailer)
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build
# Stage 2: Only use build file (from builder stage) => reduce img size
FROM node:20-alpine

WORKDIR /app
# Copy necessary files/folders from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/templates ./dist/templates
# Use legacy-peer-deps to advoid dependency conflict issues. (Nest 11 with BullMQ and NodeMailer)
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts

EXPOSE 3000

CMD ["node", "dist/src/main"]