import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  // Rate limit health checks
  const rl = checkRateLimit(`health_${ip}`, { windowMs: 60 * 1000, maxRequests: 120 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const checks: Record<string, "ok" | "degraded" | "failed"> = {
    app: "ok",
    database: "degraded",
  };

  try {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT 1;");
      if (res.rowCount === 1) {
        checks.database = "ok";
      }
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn("Database health probe non-fatal exception", { error: err });
    checks.database = "degraded";
  }

  const overallStatus = checks.database === "ok" ? "healthy" : "degraded";
  const latencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks,
      latencyMs,
    },
    {
      status: overallStatus === "healthy" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
