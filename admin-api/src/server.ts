import { app } from "./app";
import { env } from "./config/env";
import { validateRuntimeConfig } from "./config/runtime";

validateRuntimeConfig();

app.listen(env.port, () => {
  console.log(`campus-admin-api running on port ${env.port}`);
  console.log(`public base url: ${env.publicBaseUrl}`);
});
