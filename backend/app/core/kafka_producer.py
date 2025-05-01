import json, os, asyncio
from typing import Dict, Any

from aiokafka import AIOKafkaProducer
from app.core.delta_stream import broadcast

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

producer: AIOKafkaProducer | None = None

async def _init():
    global producer
    if producer is None:
        producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP)
        await producer.start()

async def publish(topic: str, payload: Dict[str, Any]):
    await _init()
    data = json.dumps(payload).encode()
    await producer.send_and_wait(topic, data)
    # also broadcast to websockets
    await broadcast(payload) 