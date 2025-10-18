'use client';

import React from "react";
import {
  Package, Shirt, Package2, Layers, TrendingUp, Gauge, Droplet, Ruler, AlertTriangle
} from "lucide-react";
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";

// shadcn/ui
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// recharts
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from "recharts";

/* =========================
   Types (aligned to your models)
========================= */
type ApiProduct = {
  _id: string;
  productId: string;
  productName: string;
  description: string;
  price: number;
  photoUrl: string;
  colors: string[];
  sizes: string[];
  category: "T-Shirt" | "Intimate";
  stock: number;
  createdAt?: string;
  updatedAt?: string;
};

type Design = {
  _id: string;
  designUrl: string;
  imageUrls: string[];
  texts: Array<{
    content: string;
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    left?: number;
    top?: number;
    angle?: number;
  }>;
  productName?: string;
  createdAt: string;
};

type TabValue = "today" | "week" | "month";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

/* =========================
   Helpers
========================= */
const barColors = [
  "#e3e3e3", // light gray-white
  "#171717", // black
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e"  // green
];
const pieColors = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e",  // green
  "#e5e5e5", // light gray-white
  "#171717", // black
];
const sizeColors = [
  "#0ea5e9", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
];

const dayKey = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

function rangeForTab(tab: TabValue) {
  const end = new Date();
  const start = new Date();
  if (tab === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (tab === "week") {
    start.setDate(end.getDate() - 6); // last 7 days (incl today)
    start.setHours(0, 0, 0, 0);
  } else {
    start.setDate(end.getDate() - 29); // last 30 days
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

function withinRange(iso: string | undefined, start: Date, end: Date) {
  if (!iso) return false;
  const ts = +new Date(iso);
  return ts >= +start && ts <= +end;
}

/* =========================
   Page
========================= */
export default function AdminDashboard() {
  const [tab, setTab] = React.useState<TabValue>("week");
  const [products, setProducts] = React.useState<ApiProduct[]>([]);
  const [productsTotal, setProductsTotal] = React.useState<number>(0);
  const [designs, setDesigns] = React.useState<Design[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        // products
        const prodRes = await fetch(`${API_BASE}/api/products?limit=200&sort=-createdAt`, { cache: "no-store" });
        if (!prodRes.ok) throw new Error(`Products HTTP ${prodRes.status}`);
        const prodPayload: { data: ApiProduct[]; total: number } = await prodRes.json();

        // designs (protected? include token if required)
        const token = localStorage.getItem("access_token");
        const desRes = await fetch(`${API_BASE}/api/designs`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });
        let desPayload: { data?: Design[] } = {};
        if (desRes.ok) desPayload = await desRes.json();

        if (!cancelled) {
          setProducts(prodPayload.data || []);
          setProductsTotal(prodPayload.total || (prodPayload.data?.length ?? 0));
          setDesigns(desPayload.data || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Derived metrics
  const tshirtCount = React.useMemo(
    () => products.filter((p) => p.category === "T-Shirt").length,
    [products]
  );
  const intimateCount = React.useMemo(
    () => products.filter((p) => p.category === "Intimate").length,
    [products]
  );

  const avgPrice = React.useMemo(() => {
    if (!products.length) return 0;
    const sum = products.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
    return Math.round((sum / products.length) * 100) / 100;
  }, [products]);

  const lowStock = React.useMemo(
    () =>
      [...products]
        .filter((p) => (p.stock ?? 0) <= 5)
        .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
        .slice(0, 6),
    [products]
  );

  // timeframe
  const { start, end } = React.useMemo(() => rangeForTab(tab), [tab]);

  // New arrivals by day (respect tab)
  const arrivalsByDay = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (!withinRange(p.createdAt, start, end)) continue;
      const k = dayKey(new Date(p.createdAt!));
      map.set(k, (map.get(k) || 0) + 1);
    }
    // fill empty days to smooth chart
    const filled: { name: string; arrivals: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const k = dayKey(cur);
      filled.push({ name: k, arrivals: map.get(k) || 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return filled;
  }, [products, start, end]);

  const newInPeriod = React.useMemo(
    () => arrivalsByDay.reduce((acc, d) => acc + d.arrivals, 0),
    [arrivalsByDay]
  );

  // Category share (pie)
  const categoryShare = React.useMemo(
    () => [
      { name: "T-Shirt", value: tshirtCount },
      { name: "Intimate", value: intimateCount },
    ],
    [tshirtCount, intimateCount]
  );

  // Colors (bar) – counts occurrence across products
  const topColors = React.useMemo(() => {
    const cnt = new Map<string, number>();
    for (const p of products) for (const c of p.colors || []) {
      cnt.set(c, (cnt.get(c) || 0) + 1);
    }
    const arr = Array.from(cnt.entries()).map(([name, count]) => ({ name, count }));
    return arr.sort((a, b) => b.count - a.count).slice(0, 7);
  }, [products]);

  // Sizes (pie) – counts occurrence across products
  const sizeShare = React.useMemo(() => {
    const cnt = new Map<string, number>();
    for (const p of products) for (const s of p.sizes || []) {
      cnt.set(s, (cnt.get(s) || 0) + 1);
    }
    return Array.from(cnt.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  const latestDesigns = React.useMemo(
    () => [...designs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    [designs]
  );

  return (
    <div className="flex min-h-screen bg-[#f7f5ef]">
      <AdminNavBar />

      <main className="flex-1 p-6 mt-20">
        {err && (
          <Card className="border-rose-200 bg-rose-50 mb-6 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-rose-700">Data Load Error</CardTitle>
              <CardDescription>{err}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Top KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <KpiCard
            title="Total Products"
            value={productsTotal}
            icon={<Package className="h-5 w-5 text-muted-foreground" />}
            hint="All products"
          />
          <KpiCard
            title="T-Shirts"
            value={tshirtCount}
            icon={<Shirt className="h-5 w-5 text-muted-foreground" />}
            hint="Category: T-Shirt"
          />
          <KpiCard
            title="Intimates"
            value={intimateCount}
            icon={<Package2 className="h-5 w-5 text-muted-foreground" />}
            hint="Category: Intimate"
          />
          <KpiCard
            title="Total Designs"
            value={designs.length}
            icon={<Layers className="h-5 w-5 text-muted-foreground" />}
            hint="Saved customizations"
          />
          <KpiCard
            title={`New (${tab})`}
            value={newInPeriod}
            icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
            hint="New arrivals this period"
            accent="success"
          />
          <KpiCard
            title="Avg Price"
            value={`Rs. ${avgPrice}`}
            icon={<Gauge className="h-5 w-5 text-muted-foreground" />}
            hint="Average of catalog"
          />
        </section>

        <div className="flex items-center justify-between mt-6">
          <h2 className="text-lg font-semibold">Analytics</h2>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-auto">
            <TabsList>
              <TabsTrigger value="today" className="cursor-pointer">Today</TabsTrigger>
              <TabsTrigger value="week" className="cursor-pointer">Week</TabsTrigger>
              <TabsTrigger value="month" className="cursor-pointer">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Separator className="my-4" />

        {/* Charts row */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* New Arrivals */}
          <Card className="rounded-2xl xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle>New Arrivals</CardTitle>
              <CardDescription>Products created per day</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={arrivalsByDay}>
                  <defs>
                    <linearGradient id="arrivals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="arrivals" stroke="#22c55e" fill="url(#arrivals)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Share */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Category Share</CardTitle>
              <CardDescription>T-Shirt vs Intimate</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(v: number) => `${v}`} />
                  <Legend />
                  <Pie data={categoryShare} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {categoryShare.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* More Insights */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          {/* Top Colors */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-muted-foreground" />
                Top Colors
              </CardTitle>
              <CardDescription>Colors on products</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topColors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count">
                    {topColors.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sizes Share */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-muted-foreground" />
                Sizes Share
              </CardTitle>
              <CardDescription>Sizes offered across catalog</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(v: number) => `${v}`} />
                  <Legend />
                  <Pie data={sizeShare} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {sizeShare.map((_, i) => (
                      <Cell key={i} fill={sizeColors[i % sizeColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Low Stock */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Low Stock
              </CardTitle>
              <CardDescription>≤ 5 units</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-sm text-muted-foreground">
                        No low-stock items. 🎉
                      </TableCell>
                    </TableRow>
                  )}
                  {lowStock.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">{p.productName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={p.stock <= 2 ? "bg-rose-600 hover:bg-rose-600" : ""}>
                          {p.stock ?? 0}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-6" />

        {/* Latest Designs */}
        <section className="grid grid-cols-1 gap-6">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Latest Designs</CardTitle>
              <CardDescription>Recent customizations saved by users</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Texts</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestDesigns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">
                        No designs yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {latestDesigns.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.designUrl} alt="Design" className="h-20 w-20 rounded object-cover border" />
                      </TableCell>
                      <TableCell className="font-medium">{d.productName || "T-Shirt"}</TableCell>
                      <TableCell className="font-medium">{d.texts?.length ?? 0}</TableCell>
                      <TableCell className="font-medium font-poppins">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        <Badge variant="outline">Saved</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading dashboard…</p>}
      </main>
    </div>
  );
}

/* =========================
   Small components
========================= */
function KpiCard({
  title, value, icon, hint, accent,
}: {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  hint?: string;
  /** accent: "success" | "warn" | "danger" */
  accent?: "success" | "warn" | "danger";
}) {
  const accentClass =
    accent === "success" ? "text-emerald-600" :
    accent === "warn" ? "text-amber-600" :
    accent === "danger" ? "text-rose-600" : "text-muted-foreground";

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={accentClass}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
