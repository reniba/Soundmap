import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST || "database",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "admin_g4",
  password: process.env.DB_PASSWORD || "admin_g4",
  database: process.env.DB_NAME || "soundmap",
});
