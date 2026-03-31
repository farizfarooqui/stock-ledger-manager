import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getProducts, saveProducts, getMovements, saveMovements, getSuppliers, saveSuppliers, getLedgerEntries, saveLedgerEntries } from "@/stores/inventoryStore";
import { toast } from "sonner";
import { ArrowDownToLine } from "lucide-react";
import { motion } from "framer-motion";

const StockIn = () => {
  const [products] = useState(getProducts);
  const [suppliers] = useState(getSuppliers);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"paid" | "unpaid">("unpaid");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);
  const totalCost = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.costPrice * (Number(quantity) || 0);
  }, [selectedProduct, quantity]);

  const remaining = useMemo(() => {
    return Math.max(0, totalCost - (Number(paidAmount) || 0));
  }, [totalCost, paidAmount]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) return;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const qty = Number(quantity);
    const updatedProducts = products.map((p) => p.id === productId ? { ...p, stock: p.stock + qty } : p);
    saveProducts(updatedProducts);

    const movements = getMovements();
    movements.unshift({
      id: `m${Date.now()}`,
      productId,
      productName: product.name,
      type: "in",
      quantity: qty,
      date: new Date().toISOString().split("T")[0],
      note,
      supplierId: supplierId || undefined,
    });
    saveMovements(movements);

    // Ledger integration for supplier
    if (supplierId && remaining > 0) {
      const ledger = getLedgerEntries();
      ledger.unshift({
        id: `l${Date.now()}`,
        entityId: supplierId,
        entityType: "supplier",
        type: "debit",
        amount: remaining,
        description: `Stock In: ${qty} ${product.unit} of ${product.name} — outstanding`,
        date: new Date().toISOString().split("T")[0],
      });
      saveLedgerEntries(ledger);

      const allSuppliers = getSuppliers();
      const updatedSuppliers = allSuppliers.map((s) =>
        s.id === supplierId ? { ...s, totalOwed: s.totalOwed + remaining } : s
      );
      saveSuppliers(updatedSuppliers);
    }
    if (supplierId && Number(paidAmount) > 0) {
      const ledger = getLedgerEntries();
      ledger.unshift({
        id: `l${Date.now() + 1}`,
        entityId: supplierId,
        entityType: "supplier",
        type: "credit",
        amount: Number(paidAmount),
        description: `Payment for Stock In: ${product.name}`,
        date: new Date().toISOString().split("T")[0],
      });
      saveLedgerEntries(ledger);

      const allSuppliers = getSuppliers();
      const updatedSuppliers = allSuppliers.map((s) =>
        s.id === supplierId ? { ...s, totalPaid: s.totalPaid + Number(paidAmount) } : s
      );
      saveSuppliers(updatedSuppliers);
    }

    toast.success(`Added ${qty} ${product.unit} of ${product.name}`);
    setProductId("");
    setQuantity("");
    setSupplierId("");
    setNote("");
    setPaidAmount("");
    setTxStatus("unpaid");
  };

  const recentMovements = getMovements().filter((m) => m.type === "in").slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Stock In</h1>
        <p className="text-muted-foreground text-sm">Record incoming inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowDownToLine className="h-4 w-4 text-accent" /> Add Stock</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label>Product</Label>
                  <Select value={productId} onValueChange={setProductId} required>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="_none" disabled>No products — add in Inventory first</SelectItem>
                      ) : products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Supplier (optional)</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.length === 0 ? (
                        <SelectItem value="_none" disabled>No suppliers yet</SelectItem>
                      ) : suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Note</Label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Bulk order" />
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="space-y-1">
                    <Label>Total Cost (PKR)</Label>
                    <Input type="number" value={totalCost} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <Label>Paid Amount (PKR)</Label>
                    <Input type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <Label>Remaining Amount (PKR)</Label>
                    <Input type="number" value={remaining} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <Label>Transaction Status</Label>
                    <Select value={txStatus} onValueChange={(v) => setTxStatus(v as "paid" | "unpaid")} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full">Record Stock In</Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Inbound</CardTitle></CardHeader>
            <CardContent>
              {recentMovements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No stock-in records yet</p>
              ) : (
                <div className="space-y-3">
                  {recentMovements.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{m.productName}</p>
                        <p className="text-xs text-muted-foreground">{m.note} · {m.date}</p>
                      </div>
                      <span className="text-sm font-mono font-medium text-accent">+{m.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stock In</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to add {quantity} units of {selectedProduct?.name || "product"}. Total cost: ₨ {totalCost.toLocaleString()}, Paid: ₨ {(Number(paidAmount) || 0).toLocaleString()}, Remaining: ₨ {remaining.toLocaleString()}. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StockIn;
