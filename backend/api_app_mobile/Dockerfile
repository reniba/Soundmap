FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g typescript

COPY . .

RUN npm run build

EXPOSE 4343

CMD ["node", "dist/index.js"]