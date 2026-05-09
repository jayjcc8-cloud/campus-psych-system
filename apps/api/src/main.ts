import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DatabaseService } from "./database/database.service.js";

async function bootstrap() {
  assertProductionConfig();

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) : true,
    credentials: true
  });

  const database = app.get(DatabaseService);
  await database.initialize();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();

function assertProductionConfig() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const missing = ["HASH_SECRET", "ADMIN_TOKEN_SECRET", "CORS_ORIGIN", "DATABASE_URL"].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Production config missing: ${missing.join(", ")}`);
  }
}
