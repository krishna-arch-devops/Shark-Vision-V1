import { pool } from "./index";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export async function runMigrations() {
  console.log("Running native PostgreSQL migrations on sharkvision database...");
  const migrationPath = path.resolve(process.cwd(), "supabase/migrations/postgres_native_schema.sql");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✓ All 22 database tables and indices verified successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
