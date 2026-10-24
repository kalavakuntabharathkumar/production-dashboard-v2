import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

function Stat({ label, value, note }) {
  return <article className="stat"><p>{label}</p><strong>{value}</strong><span>{note}</span></article>;
}

export default function App() {
  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const responses = await Promise.all([
          fetch(`${API}/dashboard/summary`), fetch(`${API}/inventory`), fetch(`${API}/orders`)
        ]);
        if (responses.some(response => !response.ok)) throw new Error("API request failed. Is the backend running?");
        const [s, i, o] = await Promise.all(responses.map(response => response.json()));
        setSummary(s); setInventory(i); setOrders(o);
      } catch (e) { setError(e.message); }
    }
    load();
  }, []);

  return <main className="shell">
    <header className="topbar">
      <div><span className="eyebrow">OPERATIONS / OVERVIEW</span><h1>Production dashboard</h1><p>Inventory, orders and supplier health at a glance.</p></div>
      <span className="live"><i /> API dashboard</span>
    </header>
    {error && <div className="error">{error} — run <code>docker compose up --build</code>.</div>}
    <section className="stats">
      <Stat label="Inventory units" value={summary?.inventory?.units ?? "—"} note={`${summary?.inventory?.count ?? "—"} SKUs tracked`} />
      <Stat label="Open order value" value={summary ? money(summary.orders.value) : "—"} note={`${summary?.orders?.count ?? "—"} non-cancelled orders`} />
      <Stat label="Active suppliers" value={summary?.activeSuppliers ?? "—"} note="Supplier directory" />
      <Stat label="Low-stock SKUs" value={summary?.lowStockItems ?? "—"} note="At or below reorder level" />
    </section>
    <section className="panel">
      <div className="section-heading"><div><h2>Inventory</h2><p>Current stock and reorder thresholds</p></div><span className="count">{inventory.length} items</span></div>
      <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Item</th><th>Category</th><th>Supplier</th><th>Stock</th><th>Unit price</th></tr></thead>
      <tbody>{inventory.map(item => <tr key={item.id}><td className="sku">{item.sku}</td><td>{item.name}</td><td>{item.category || "—"}</td><td>{item.supplier || "—"}</td><td><span className={`stock ${item.quantity <= item.reorder_level ? "low" : ""}`}>{item.quantity}{item.quantity <= item.reorder_level ? " · Reorder" : ""}</span></td><td>{money(item.unit_price)}</td></tr>)}
      {!inventory.length && <tr><td colSpan="6" className="empty">Inventory will appear when the API responds.</td></tr>}</tbody></table></div>
    </section>
    <section className="panel">
      <div className="section-heading"><div><h2>Recent orders</h2><p>Latest order status and value</p></div><span className="count">{orders.length} orders</span></div>
      <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Date</th><th>Total</th></tr></thead>
      <tbody>{orders.map(order => <tr key={order.id}><td className="sku">{order.order_number}</td><td>{order.customer || "—"}</td><td><span className={`status ${order.status}`}>{order.status}</span></td><td>{new Date(order.created_at).toLocaleDateString()}</td><td>{money(order.total)}</td></tr>)}
      {!orders.length && <tr><td colSpan="5" className="empty">Orders will appear when the API responds.</td></tr>}</tbody></table></div>
    </section>
    <footer>Internal operations starter · React + Express + PostgreSQL</footer>
  </main>;
}
