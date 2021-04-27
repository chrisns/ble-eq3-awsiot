FROM node:16-alpine as builder
RUN apk add --no-cache bluez python make g++ bluez-deprecated git
WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm i --silent
RUN npm audit fix

FROM node:16-alpine
RUN apk add --no-cache bluez bluez-deprecated libcap
RUN setcap cap_net_raw+eip $(eval readlink -f `which node`)
COPY --from=builder /app /app
WORKDIR /app 
COPY index.js .
USER node
CMD npm start
