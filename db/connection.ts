import { DataSource } from "typeorm";
import { user } from "../src/userModule/userEntity";

import * as dotenv from "dotenv";

dotenv.config();

const dataSource = new DataSource({
  type: "mongodb",
  url: process.env.MONGO_URL!, // MongoDB connection string from .env
      database: "leavemanagementsystem",

  synchronize: true,           // auto sync schema - disable in production
  entities: [user],
});

async function initializeDataSource() {
  try {
    await dataSource.initialize();
    console.log("✅ MongoDB connected!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // exit if DB connection fails
  }
}

initializeDataSource();

export { dataSource };
