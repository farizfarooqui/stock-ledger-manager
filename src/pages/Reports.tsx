import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts, getMovements, getInvoices, getCustomers, getSuppliers } from "@/stores/inventoryStore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const COLORS = ["hsl(220, 60%, 45%)", "hsl(152, 55%, 42%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(270, 50%, 50%)"];

const Reports = () => {
  const data = useMemo(() => {
    const products = getProducts();
    const movements = getMovements();
    const invoices = getInvoices();
    const customers = getCustomers();
    const suppliers = getSuppliers();

    // Category distribution
    const categoryMap: Record<string, number> = {};
    products.forEach((p) => { categoryMap[p.category] = (categoryMap[p.category] || 0) + p.stock; });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Sales by product (from movements)
    const salesMap: Record<string, number> = {};
    movements.filter((m) => m.type === "out").forEach((m) => { salesMap[m.productName] = (salesMap[m.productName] || 0) + m.quantity; });
    const salesData = Object.entries(salesMap).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty);

    // Revenue summary
    const totalRevenue = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const totalPending = invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);
    const totalInventoryValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
    const totalRetailValue = products.reduce((s, p) => s + p.stock * p.price, 0);
    const totalSupplierDues = suppliers.reduce((s, sup) => s + sup.totalOwed, 0);
    const totalCustomerCredit = customers.reduce((s, c) => s + c.totalCredit, 0);

    return { categoryData, salesData, totalRevenue, totalPending, totalInventoryValue, totalRetailValue, totalSupplierDues, totalCustomerCredit };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Reports</h1>
        <p className="text-muted-foreground text-sm">Business insights and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `₨ ${data.totalRevenue.toLocaleString()}` },
          { label: "Pending Payments", value: `₨ ${data.totalPending.toLocaleString()}` },
          { label: "Inventory Value", value: `₨ ${data.totalInventoryValue.toLocaleString()}` },
          { label: "Retail Value", value: `₨ ${data.totalRetailValue.toLocaleString()}` },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold font-mono mt-1">{item.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="text-base">Sales by Product</CardTitle></CardHeader>
            <CardContent>
              {data.salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="hsl(220, 60%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No sales data yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader><CardTitle className="text-base">Stock by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {data.categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Financial Summary */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Supplier Dues</p>
                <p className="text-lg font-bold font-mono text-destructive">₨ {data.totalSupplierDues.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Customer Credit</p>
                <p className="text-lg font-bold font-mono text-warning">₨ {data.totalCustomerCredit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Reports;
