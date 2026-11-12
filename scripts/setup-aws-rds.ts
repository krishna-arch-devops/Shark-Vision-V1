import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

const masterConfig = {
  host: "100.56.116.238",
  port: 5432,
  user: "postgres",
  password: "3iVgZQe)[g68_oERVwAbeMlU~?tp",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
};

async function setup() {
  console.log("Connecting to RDS master endpoint...");
  const client = new Client(masterConfig);
  await client.connect();
  console.log("Connected successfully to RDS PostgreSQL 18.3!");

  // List existing databases
  const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false;");
  console.log("Existing databases:", res.rows.map(r => r.datname));

  // Check if sharkvision db exists
  const sharkDb = res.rows.find(r => r.datname === "sharkvision");
  if (!sharkDb) {
    console.log("Creating database sharkvision...");
    await client.query("CREATE DATABASE sharkvision;");
    console.log("Database sharkvision created!");
  } else {
    console.log("Database sharkvision already exists.");
  }

  // Create least-privilege user
  const userCheck = await client.query("SELECT usename FROM pg_user WHERE usename = 'sharkvision_app';");
  if (userCheck.rows.length === 0) {
    console.log("Creating user sharkvision_app...");
    await client.query("CREATE USER sharkvision_app WITH ENCRYPTED PASSWORD 'SharkVisionProd2026!Secure';");
    await client.query("GRANT ALL PRIVILEGES ON DATABASE sharkvision TO sharkvision_app;");
    console.log("User sharkvision_app created and granted permissions.");
  } else {
    console.log("User sharkvision_app already exists.");
  }

  await client.end();

  // Now connect to sharkvision database to apply schema
  console.log("\nConnecting to sharkvision database...");
  const sharkClient = new Client({
    ...masterConfig,
    database: "sharkvision",
  });
  await sharkClient.connect();

  const schemaSql = fs.readFileSync(path.join(__dirname, "../supabase/migrations/postgres_native_schema.sql"), "utf-8");
  console.log("Applying postgres_native_schema.sql...");
  await sharkClient.query(schemaSql);
  console.log("Schema applied successfully!");

  // Verify tables created
  const tables = await sharkClient.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("Tables in sharkvision:", tables.rows.map(r => r.table_name));

  await sharkClient.end();
  console.log("Setup complete!");
}

setup().catch(err => {
  console.error("Setup failed:", err);
  process.exit(1);
});
