import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes/index";
import { traceIdMiddleware } from "./middlewares/trace-id";
import { notFoundHandler } from "./middlewares/not-found";
import { errorHandler } from "./middlewares/error-handler";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(morgan("dev"));
app.use(traceIdMiddleware);
app.use("/uploads", express.static(env.uploadsDir));

app.get("/health", (req, res) => {
  res.json({
    code: 0,
    message: "ok",
    data: { status: "up" },
    traceId: req.traceId
  });
});

app.use(routes);
app.use(notFoundHandler);
app.use(errorHandler);
