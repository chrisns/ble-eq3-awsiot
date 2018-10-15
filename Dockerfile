FROM node:8-alpine as builder
RUN apk add --no-cache bluez python make g++ bluez-deprecated git
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm i --silent
RUN npm audit fix

FROM node:8-alpine
RUN apk add --no-cache bluez bluez-deprecated
COPY --from=builder /app /app
COPY index.js .
WORKDIR /app 

CMD npm start
