# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install dependencies first with npm cache mount for faster builds
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy application source code
COPY . .

# Default environment variables
ENV VITE_API_BASE_URL=http://localhost:8000

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
