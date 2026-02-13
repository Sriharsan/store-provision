FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 9000

ENV NODE_ENV=production

CMD ["npx","medusa","start"]
