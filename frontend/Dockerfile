FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 8080

# Populate node_modules in the mounted volume (needed when using frontend_node_modules volume)
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0"]
