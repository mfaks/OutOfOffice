FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chown -R node /app
USER node

EXPOSE 5173

CMD ["npm", "run", "dev"]
