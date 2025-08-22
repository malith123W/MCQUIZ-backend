FROM node:18-bullseye
WORKDIR /app
COPY package.json ./
RUN npm install --build-from-source
COPY . .
EXPOSE 3001
CMD [ "npm", "run", "start" ]

