import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import { getRedisClient, closeRedisClient } from "./database/redis.js";
import UserRouter from "./routes/User.routes.js";
import AreaRouter from "./routes/Area.routes.js";
import SensorRouter from "./routes/Sensor.routes.js";
import authMiddleware from "./middlewares/auth.js";
import MeasureRouter from "./routes/Measure.routes.js";
import MapRouter from "./routes/Map.routes.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/user", UserRouter);
app.use("/area", authMiddleware, AreaRouter);
app.use("/sensor", authMiddleware, SensorRouter);
app.use("/measure", authMiddleware, MeasureRouter);
app.use("/map", authMiddleware, MapRouter);

app.use(errorHandler);

app.listen(4344, "0.0.0.0", async () => {
  await getRedisClient();
});

await closeRedisClient;
