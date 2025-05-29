FROM node:20

WORKDIR /app

COPY package*.json ./

RUN yarn install

COPY prisma ./prisma

RUN npx prisma generate

COPY . . 

EXPOSE 4000

CMD ["yarn", "start:dev"]

