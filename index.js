const AWS = require("aws-sdk")
const util = require("util")
const EQ3BLE = require('eq3ble').default;
const AWSMqtt = require("aws-mqtt-client").default

const {AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, AWS_IOT_ENDPOINT_HOST, AWS_REGION, DEBUG} = process.env

const iot = new AWS.Iot({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
  debug: DEBUG
})

const iotdata = new AWS.IotData({
  endpoint: AWS_IOT_ENDPOINT_HOST,
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
  debug: DEBUG
})

const awsMqttClient = new AWSMqtt({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  endpointAddress: AWS_IOT_ENDPOINT_HOST,
  region: AWS_REGION,
  logger: console
})

awsMqttClient.async_publish = util.promisify(awsMqttClient.publish)
awsMqttClient.async_subscribe = util.promisify(awsMqttClient.subscribe)

const subscriptions = []

const subscribe_to_thing = async (thingName, topic = `$aws/things/${thingName}/shadow/update/delta`) => {
  if (subscriptions.includes(topic)) return
  subscriptions.push(topic)
  console.log("subscribing to topic", topic)
  try {
    await awsMqttClient.async_subscribe(topic, { qos: 1 })
    await awsMqttClient.async_publish(`$aws/things/${thingName}/shadow/update`, JSON.stringify({ state: { desired: { ignore_me: null } } }))
  }
  catch (error) {
    console.error(error)
  }
}

awsMqttClient.on("connect", () => subscriptions.forEach(subscription => awsMqttClient.subscribe(subscription)))
awsMqttClient.on("connect", () => console.log("aws connected"))
awsMqttClient.on("error", (error) => console.error("aws", error))
awsMqttClient.on("close", () => console.error("aws connection close"))
awsMqttClient.on("offline", () => console.error("aws offline"))

const things = {}

EQ3BLE.discover(async device => {
  let params = {
    thingName: `ble_${device.id}`,
    thingTypeName: "bluez"
  }
  console.log("node available", params)
  try {
    await iot.updateThing(params).promise()
  } catch (error) {
    await iot.createThing(params).promise()
  }
  console.info(`discovered ${params.thingName}`)
  await device.connectAndSetup()
  console.info(`connected ${params.thingName}`)
  await subscribe_to_thing(params.thingName)
  
  things[params.thingName] = device

  console.log(await device.getInfo())
  await update_thing(params.thingName, device)
  setInterval(update_thing, (5*60*1000), params.thingName, device);
})

const update_thing = async (thingName, device) => iotdata.updateThingShadow({
  thingName: thingName,
  payload: JSON.stringify({state: { reported: await device.getInfo()}})
}).promise()

awsMqttClient.on("message", async (topic, message) => {
  const thingName = topic.split("/")[2]
  const payload = JSON.parse(message.toString()).state
  const device = things[thingName];
  console.log(`received`, payload)
  if (device.state === 'connected') 
    await device.connectAndSetup()
  console.log(`connected to ${thingName}`)
  if (payload.targetTemperature) device.setTemperature(payload.targetTemperature)
  if (payload.lock !== undefined) device.setLock(payload.lock)
  if (payload.status && payload.status.manual === true) device.manualMode()
  if (payload.status && payload.status.manual === false) device.automaticMode()

  await awsMqttClient.async_publish(`$aws/things/${thingName}/shadow/update`, JSON.stringify({ state: { desired: null } }))
  await update_thing(thingName, device)

})

const timeout = 60
setTimeout(() => {
  if(subscriptions.length === 0) throw `no subscriptions made in ${timeout} seconds`
}, timeout*1000)