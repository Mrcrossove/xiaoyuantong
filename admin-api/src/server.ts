import { app } from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`campus-admin-api running on http://localhost:${env.port}`);
});
