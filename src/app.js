import express from "express";
import pkg from "pg";
import client from "prom-client";

const { Pool } = pkg;

const app = express();

app.use(express.json());

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: "devops_api_http_requests_total",
  help: "Total de solicitudes HTTP recibidas por la API",
  labelNames: ["method", "route", "status"]
});

register.registerMetric(httpRequestCounter);

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: String(res.statusCode)
    });
  });

  next();
});

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.POSTGRES_USER || "devops",
  password: process.env.POSTGRES_PASSWORD || "devops123",
  database: process.env.POSTGRES_DB || "devopsdb",
  max: 5
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      creado_en TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO items (nombre)
    SELECT 'Proyecto DevOps en GCP'
    WHERE NOT EXISTS (
      SELECT 1 FROM items
      WHERE nombre = 'Proyecto DevOps en GCP'
    );
  `);
}

app.get("/", (req, res) => {
  res.json({
    message: "API DevOps funcionando en Google Cloud",
    app: process.env.APP_NAME || "devops-api",
    version: process.env.APP_VERSION || "local"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "devops-api"
  });
});

app.get("/api/items", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre, creado_en FROM items ORDER BY id"
    );

    res.json({
      database: "connected",
      items: result.rows
    });

  } catch (error) {
    res.status(500).json({
      database: "error",
      message: error.message
    });
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

export { app, initDatabase };