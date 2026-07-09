import { createClient } from "redis";
import type { RedisClientType } from "redis";
import { ApiError } from "../errors/ApiError.js";

let redisClient: RedisClientType | null = null;

export const getRedisClient = async (): Promise<RedisClientType> => { 
  if (redisClient) {
    return redisClient;
  }

  const redisHost: string = process.env.REDIS_HOST || "localhost";
  const redisPort: number = parseInt(process.env.REDIS_PORT || "6379");
  const redisUrl: string = `redis://${redisHost}:${redisPort}`;

  redisClient = createClient({ url: redisUrl});

  redisClient.on("error", (error) => console.error("Redis Client Error", error));
  
  try{
    await redisClient.connect();
    console.log("API web conectada ao Redis com sucesso");
  }
  catch(error){
    throw new ApiError(500, `Erro ao conectar ao Redis: ${error instanceof Error ? error.message : String(error)}`);
  }


  return redisClient;
};

export const closeRedisClient = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
};
