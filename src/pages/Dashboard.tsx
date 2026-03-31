import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, Users, Truck, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getProducts, getMovements, getCustomers, getSuppliers, getInvoices } from "@/stores/inventoryStore";
import { motion } from "framer-motion";

const StatCard = ({ title, value, subtitle, icon: Icon, trend, delay }: {
  title: string; value: string; subtitle: string; icon: React.ElementType; trend?: "up" | "down"; delay: number;
}) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-heading mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {trend === "up" && <ArrowUpRight className="h-3 w-3 text-accent" />}
              {trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
              {subtitle}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const data = useMemo(() => {
    const products = getProducts();
    const movements = getMovements();
    const customers = getCustomers();
    const suppliers = getSuppliers();
    const invoices = getInvoices();
    const today = new Date().toISOString().split("T")[0];
    const todayMovements = movements.filter((m) => m.date === today);
    const todaySales = todayMovements.filter((m) => m.type === "out");
    const lowStock = products.filter((p) => p.stock <= p.minStock);
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalCredit = customers.reduce((sum, c) => sum + c.totalCredit, 0);
    const totalOwed = suppliers.reduce((sum, s) => sum + s.totalOwed, 0);

    return { products, movements, customers, suppliers, invoices, todaySales, lowStock, totalRevenue, totalCredit, totalOwed };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your business at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={String(data.products.length)} subtitle={`${data.lowStock.length} low stock`} icon={Package} trend="up" delay={0} />
        <StatCard title="Today's Sales" value={String(data.todaySales.length)} subtitle="transactions today" icon={TrendingUp} trend="up" delay={0.05} />
        <StatCard title="Customer Credit" value={`₨ ${data.totalCredit.toLocaleString()}`} subtitle="total outstanding" icon={Users} trend="down" delay={0.1} />
        <StatCard title="Supplier Dues" value={`₨ ${data.totalOwed.toLocaleString()}`} subtitle="total payable" icon={Truck} delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {data.movements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No movements yet</p>
              ) : (
                <div className="space-y-3">
                  {data.movements.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${m.type === "in" ? "bg-accent" : "bg-warning"}`} />
                        <div>
                          <p className="text-sm font-medium">{m.productName}</p>
                          <p className="text-xs text-muted-foreground">{m.note}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-mono font-medium ${m.type === "in" ? "text-accent" : "text-warning"}`}>
                        {m.type === "in" ? "+" : "-"}{m.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">All items are well stocked!</p>
              ) : (
                <div className="space-y-3">
                  {data.lowStock.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Min: {p.minStock} {p.unit}</p>
                      </div>
                      <span className="text-sm font-mono font-medium text-destructive">{p.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
