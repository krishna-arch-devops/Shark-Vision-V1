import { pool } from "./index";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config({ path: ".env.local" });

async function resetDevDatabase() {
  if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("rds.amazonaws.com")) {
    console.error("FATAL: db:reset:dev is strictly prohibited on production or remote RDS instances!");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  const answer = await question(
    "WARNING: This will drop and re-create all tables in your local development database.\nAre you absolutely sure? Type 'RESET_LOCAL_DEV' to confirm: "
  );
  rl.close();

  if (answer.trim() !== "RESET_LOCAL_DEV") {
    console.log("Database reset aborted.");
    process.exit(0);
  }

  console.log("Proceeding with development database reset...");
  const client = await pool.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    console.log("✓ Schema public dropped and recreated.");
  } finally {
    client.release();
  }
}

if (require.main === module) {
  resetDevDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
