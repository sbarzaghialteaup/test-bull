FROM node:12.18-alpine
ENV NODE_ENV=production
ENV REDIS_URI=redis://172.26.164.158:6379
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 8090
CMD ["node", "monitor.js"]   
