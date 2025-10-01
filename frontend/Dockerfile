FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build args and env vars
ARG VITE_API_URL
ARG VITE_OCR_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_OCR_API_URL=${VITE_OCR_API_URL}

# Build the app
RUN npm run build

# Serve the app
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
