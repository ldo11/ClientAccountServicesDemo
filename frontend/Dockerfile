FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

EXPOSE 3000

CMD ["npx", "vite", "--port", "3000", "--strictPort", "--host", "0.0.0.0"]
