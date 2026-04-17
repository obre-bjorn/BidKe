import 'dotenv/config';
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;



const redisClient =createClient({
    url: process.env.REDIS_URL,
   });

redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
});


await redisClient.connect();

export default redisClient;

