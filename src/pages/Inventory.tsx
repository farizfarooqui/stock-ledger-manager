import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus } from "lucide-react";
import { getProducts, saveProducts, Product } from "@/stores/inventoryStore";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", category: "", price: "", costPrice: "", unit: "pcs", minStock: "10" });

  const filtered = useMemo(() =>
    products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: `p${Date.now()}`,
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      stock: 0,
      unit: form.unit,
      minStock: Number(form.minStock),
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    saveProducts(updated);
    setOpen(false);
    setForm({ name: "", sku: "", category: "", price: "", costPrice: "", unit: "pcs", minStock: "10" });
    toast.success("Product added successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Inventory</h1>
          <p className="text-muted-foreground text-sm">{products.length} products in stock</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>SKU</Label><Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                <div className="space-y-1"><Label>Category</Label><Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div className="space-y-1"><Label>Unit</Label><Input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
                <div className="space-y-1"><Label>Sale Price</Label><Input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="space-y-1"><Label>Cost Price</Label><Input type="number" required value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
                <div className="space-y-1"><Label>Min Stock Alert</Label><Input type="number" required value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Add Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">SKU</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{p.name}</td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="p-4 text-muted-foreground">{p.category}</td>
                      <td className="p-4 text-right font-mono">₨ {p.price}</td>
                      <td className="p-4 text-right font-mono">{p.stock} {p.unit}</td>
                      <td className="p-4">
                        {p.stock <= p.minStock ? (
                          <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">In Stock</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Inventory;
