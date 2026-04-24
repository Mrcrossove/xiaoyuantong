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
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed"));
    }
  })
);
app.use(
  express.json({
    limit: "12mb",
    verify(req, _res, buf) {
      (req as any).rawBody = buf.toString("utf8");
    }
  })
);
app.use(morgan("dev"));
app.use(traceIdMiddleware);
app.use(
  "/uploads",
  express.static(env.uploadsDir, {
    setHeaders(res) {
      // Allow images uploaded by admins to be embedded by the mini-program.
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  })
);

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
