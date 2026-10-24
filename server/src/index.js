import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://operations:operations_dev@localhost:5432/operations",
  connectionTimeoutMillis: 5000
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", database: "unavailable" });
  }
});

app.get("/api/dashboard/summary", async (_req, res, next) => {
  try {
    const [inventory, orders, suppliers, lowStock] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count, COALESCE(SUM(quantity),0)::int AS units FROM inventory"),
      pool.query("SELECT COUNT(*)::int AS count, COALESCE(SUM(total),0)::numeric(12,2) AS value FROM orders WHERE status <> 'cancelled'"),
      pool.query("SELECT COUNT(*)::int AS count FROM suppliers WHERE status = 'active'"),
      pool.query("SELECT COUNT(*)::int AS count FROM inventory WHERE quantity <= reorder_level")
    ]);
    res.json({
      inventory: inventory.rows[0],
      orders: orders.rows[0],
      activeSuppliers: suppliers.rows[0].count,
      lowStockItems: lowStock.rows[0].count
    });
  } catch (error) { next(error); }
});

app.get("/api/inventory", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit || "100", 10) || 100, 1), 500);
    const result = await pool.query(
      `SELECT i.id, i.sku, i.name, i.quantity, i.reorder_level, i.unit_price,
              c.name AS category, s.name AS supplier
       FROM inventory i LEFT JOIN categories c ON c.id=i.category_id
       LEFT JOIN suppliers s ON s.id=i.supplier_id ORDER BY i.name LIMIT $1`, [limit]
    );
    res.json(result.rows);
  } catch (error) { next(error); }
});

app.get("/api/orders", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at, c.name AS customer
       FROM orders o LEFT JOIN customers c ON c.id=o.customer_id
       ORDER BY o.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) { next(error); }
});

app.post("/api/orders", async (req, res, next) => {
  const { orderNumber, customerId = null, status = "pending", total = 0 } = req.body ?? {};
  if (typeof orderNumber !== "string" || !orderNumber.trim()) {
    return res.status(400).json({ error: "orderNumber is required" });
  }
  if (!["pending", "processing", "shipped", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "invalid status" });
  }
  const amount = Number(total);
  if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: "total must be a non-negative number" });
  try {
    const result = await pool.query(
      "INSERT INTO orders(order_number, customer_id, status, total) VALUES($1,$2,$3,$4) RETURNING *",
      [orderNumber.trim(), customerId, status, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "orderNumber already exists" });
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => console.log(`Operations API listening on ${port}`));

async function shutdown() {
  server.close();
  await pool.end();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { app };
