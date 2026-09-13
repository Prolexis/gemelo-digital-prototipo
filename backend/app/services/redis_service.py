import logging
import json
import asyncio
from typing import Optional, Callable, Awaitable
import redis.asyncio as aioredis
from config import settings

logger = logging.getLogger("redis_service")

class RedisService:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.client: Optional[aioredis.Redis] = None
        self._pubsub: Optional[aioredis.client.PubSub] = None
        self._connected = False

    async def connect(self):
        """Conecta con el servidor Redis 7.0 con reintentos."""
        if self._connected and self.client:
            return

        try:
            self.client = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=5.0
            )
            await self.client.ping()
            self._connected = True
            logger.info("Conexión exitosa con Redis 7.0 Pub/Sub broker.")
        except Exception as e:
            logger.warning(f"No se pudo conectar a Redis en {self.redis_url}: {e}. Operando con fallback local.")
            self._connected = False

    async def disconnect(self):
        """Cierra conexiones activas de Redis."""
        if self._pubsub:
            await self._pubsub.close()
        if self.client:
            await self.client.close()
        self._connected = False

    async def publish(self, channel: str, message: dict) -> bool:
        """Publica un mensaje codificado en JSON a un canal Pub/Sub."""
        if not self._connected or not self.client:
            return False
        try:
            payload = json.dumps(message)
            await self.client.publish(channel, payload)
            return True
        except Exception as e:
            logger.error(f"Error publicando en canal Redis '{channel}': {e}")
            return False

    async def subscribe(self, channel: str, callback: Callable[[dict], Awaitable[None]]):
        """Se suscribe a un canal y ejecuta un callback asíncrono para cada mensaje recibido."""
        if not self._connected or not self.client:
            logger.warning("Redis no conectado; suscripción no iniciada.")
            return

        try:
            pubsub = self.client.pubsub()
            await pubsub.subscribe(channel)
            logger.info(f"Suscrito exitosamente a canal Redis: {channel}")
            
            while True:
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message and message.get("type") == "message":
                        data_str = message.get("data")
                        if data_str:
                            data = json.loads(data_str)
                            await callback(data)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Error procesando mensaje en canal {channel}: {e}")
                    await asyncio.sleep(0.5)
        except Exception as e:
            logger.error(f"Error en bucle de suscripción a {channel}: {e}")

redis_service = RedisService()
