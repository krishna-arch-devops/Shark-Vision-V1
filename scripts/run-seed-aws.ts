process.env.DATABASE_URL = "postgresql://sharkvision_app:SharkVisionProd2026!Secure@100.56.116.238:5432/sharkvision?sslmode=no-verify";

import { seedExecutiveDemo } from "./seed-executive-demo";

async function run() {
  await seedExecutiveDemo();
  console.log("ALL DEMO DATA SEEDED INTO RDS POSTGRESQL SUCCESSFULLY!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
