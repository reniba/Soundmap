import express, { json } from "express";
import UserRouter from "./routes/User.routes.js";
import AreaRouter from "./routes/Area.routes.js";
import MeasureRouter from "./routes/Measure.routes.js";
import authMiddleware from "./middlewares/auth.js";
import cors from "cors";
import { connectProducer } from "./kafka/producer.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/user", UserRouter);
app.use("/area", authMiddleware, AreaRouter);
app.use("/measure", authMiddleware, MeasureRouter);

app.listen(4343, "0.0.0.0", async () => {
  await connectProducer();
});
