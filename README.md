# Bind a eq3 thermostat to aws iot
[![](https://images.microbadger.com/badges/image/chrisns/ble-eq3-awsiot.svg)](https://microbadger.com/images/chrisns/ble-eq3-awsiot "Get your own image badge on microbadger.com")
[![](https://images.microbadger.com/badges/version/chrisns/ble-eq3-awsiot.svg)](https://microbadger.com/images/chrisns/ble-eq3-awsiot "Get your own version badge on microbadger.com")
[![](https://images.microbadger.com/badges/commit/chrisns/ble-eq3-awsiot.svg)](https://microbadger.com/images/chrisns/ble-eq3-awsiot "Get your own commit badge on microbadger.com")


To start either:
```bash
npm install
export AWS_ACCESS_KEY_ID=xxx
export AWS_REGION=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_IOT_ENDPOINT_HOST=xxx
npm start
```

Or to use Docker:
```bash
docker run \
  --rm \
  --net host \ 
  -e AWS_ACCESS_KEY_ID=xxx \ 
  -e AWS_REGION=xxx \
  -e AWS_SECRET_ACCESS_KEY=xxx \
  -e AWS_IOT_ENDPOINT_HOST=xxx \
  chrisns/ble-eq3-awsiot
```

Or to use Docker stack:
```bash
docker node update [NAME OF MACHINE/S WITH BLUETOOTH STICK] --label-add bluetooth=true
export AWS_ACCESS_KEY_ID=xxx
export AWS_REGION=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_IOT_ENDPOINT_HOST=xxx
docker deploy --compose-file docker-compose.yml ble
```