'use client'
import React from "react";
import { Search, Package, Box, AlertTriangle, ClipboardList, Shirt, Package2, Layers } from "lucide-react";
import AdminNavBar from "@/app/components/nav-bar/admin-nav-bar";

// shadcn/ui
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

/* ========== Types aligned with your models/controllers above ========== */

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
  createdAt?: string; // timestamps: true in your schema
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

/* ========== Helpers ========== */

const pieColors = ["#16a34a", "#22c55e"];

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/* ========== Dashboard ========== */

// icons

const AdminDashboard = () => {

  const [tab, setTab] = React.useState<"today" | "week" | "month">("week");

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

        // products (pull enough to chart arrivals & compute shares)
        const prodRes = await fetch(
          `${API_BASE}/api/products?limit=200&sort=-createdAt`,
          { cache: "no-store" }
        );
        if (!prodRes.ok) throw new Error(`Products HTTP ${prodRes.status}`);
        const prodPayload: { data: ApiProduct[]; total: number } = await prodRes.json();

        // designs
        const desRes = await fetch(`${API_BASE}/api/designs`, {
          cache: "no-store",
        });
        // designs may be optional in some environments; ignore failure
        let desPayload: { data?: Design[] } = {};
        if (desRes.ok) desPayload = await desRes.json();

        if (!cancelled) {
          setProducts(prodPayload.data || []);
          setProductsTotal(prodPayload.total || (prodPayload.data?.length ?? 0));
          setDesigns(desPayload.data || []);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Derived metrics from data you already have ----
  const tshirtCount = React.useMemo(
    () => products.filter((p) => p.category === "T-Shirt").length,
    [products]
  );
  const intimateCount = React.useMemo(
    () => products.filter((p) => p.category === "Intimate").length,
    [products]
  );

  // Category share for pie
  const categoryShare = React.useMemo(
    () => [
      { name: "T-Shirt", value: tshirtCount },
      { name: "Intimate", value: intimateCount },
    ],
    [tshirtCount, intimateCount]
  );

  // New arrivals per day (based on createdAt)
  const arrivalsByDay = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      const k = d ? dayKey(d) : null;
      if (!k) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    const arr = Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, arrivals]) => ({ name, arrivals }));
    return arr.slice(-14); // last 14 days
  }, [products]);

  // Latest designs (limit 5)
  const latestDesigns = React.useMemo(() => {
    return [...designs]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5);
  }, [designs]);
  

  return (
    <div className="flex min-h-screen bg-[#f7f5ef]">
      {/* Sidebar */}
      <AdminNavBar />

      {/* Main Content */}
      <main className="flex-1 p-6 mt-10">
      <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview powered by your existing Products & Designs APIs.
          </p>
        </div>

        {err && (
          <Card className="border-rose-200 bg-rose-50 mb-6 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-rose-700">Data Load Error</CardTitle>
              <CardDescription>{err}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productsTotal}</div>
              <p className="text-xs text-muted-foreground">All products in catalog</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">T-Shirts</CardTitle>
              <Shirt className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tshirtCount}</div>
              <p className="text-xs text-muted-foreground">Category: T-Shirt</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Intimates</CardTitle>
              <Package2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{intimateCount}</div>
              <p className="text-xs text-muted-foreground">Category: Intimate</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Designs</CardTitle>
              <Layers className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{designs.length}</div>
              <p className="text-xs text-muted-foreground">Saved customizations</p>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-6" />

        {/* Charts + Lists */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: New Arrivals */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>New Arrivals</CardTitle>
                    <CardDescription>Products created per day</CardDescription>
                  </div>
                  <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="today">Today</TabsTrigger>
                      <TabsTrigger value="week">Week</TabsTrigger>
                      <TabsTrigger value="month">Month</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={arrivalsByDay}>
                    <defs>
                      <linearGradient id="arrivals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.04}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="arrivals" stroke="#22c55e" fill="url(#arrivals)" strokeWidth={2} />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right: Category Share */}
          <div className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle>Category Share</CardTitle>
                <CardDescription>T-Shirt vs Intimate</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
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
          </div>
        </section>

        <Separator className="my-6" />

        {/* Latest Designs */}
        <section className="grid grid-cols-1 gap-6">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Latest Designs</CardTitle>
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
                        <img src={d.designUrl} alt="Design" className="h-12 w-12 rounded object-cover border" />
                      </TableCell>
                      <TableCell className="font-medium">{d.productName || "T-Shirt"}</TableCell>
                      <TableCell>{d.texts?.length ?? 0}</TableCell>
                      <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Saved</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {loading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading dashboard…</p>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;