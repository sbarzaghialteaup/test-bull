FROM node:12.18-alpine
ENV NODE_ENV=production
ENV REDIS_HOST=172.26.164.158
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 8089
CMD ["node", "aggiungi-jobs.js"]
