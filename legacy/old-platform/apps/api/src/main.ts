import { createApp } from "./app";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

async function start() {
  const app = createApp();
  await app.listen({ port, host });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

