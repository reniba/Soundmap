import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "mobile_app_api",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();
}

export async function sendMessage(topic: string, message: object) {
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
}

export async function disconnectProducer() {
  await producer.disconnect();
}
