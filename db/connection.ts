import { DataSource } from "typeorm";
import { User } from "../src/userModule/userEntity";

import * as dotenv from "dotenv";

dotenv.config();

const dataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USER, // <-- Ensure this is DB_USER
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 

  synchronize: true,           // auto sync schema - disable in production
  entities: ['src/userModule/**/*.ts'],
});

async function initializeDataSource() {
  try {
    await dataSource.initialize();
    console.log("✅ Sql connected!");
  } catch (error) {
    console.error("❌ Sql connection error:", error);
    process.exit(1); // exit if DB connection fails
  }
}

initializeDataSource();

export { dataSource };
