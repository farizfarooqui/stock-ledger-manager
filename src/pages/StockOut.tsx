import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getProducts, saveProducts, getMovements, saveMovements, getCustomers, saveCustomers, getLedgerEntries, saveLedgerEntries } from "@/stores/inventoryStore";
import { toast } from "sonner";
import { ArrowUpFromLine } from "lucide-react";
import { motion } from "framer-motion";

const StockOut = () => {
  const [products] = useState(getProducts);
  const [customers] = useState(getCustomers);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [txStatus, setTxStatus] = useState<"paid" | "unpaid">("unpaid");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);
  const totalAmount = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.price * (Number(quantity) || 0);
  }, [selectedProduct, quantity]);

  const remaining = useMemo(() => {
    return Math.max(0, totalAmount - (Number(paidAmount) || 0));
  }, [totalAmount, paidAmount]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const qty = Number(quantity);
    if (qty > product.stock) { toast.error("Insufficient stock!"); return; }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    const product = products.find((p) => p.id === productId)!;
    const qty = Number(quantity);

    const updatedProducts = products.map((p) => p.id === productId ? { ...p, stock: p.stock - qty } : p);
    saveProducts(updatedProducts);

    const movements = getMovements();
    movements.unshift({
      id: `m${Date.now()}`,
      productId,
      productName: product.name,
      type: "out",
      quantity: qty,
      date: new Date().toISOString().split("T")[0],
      note,
      customerId: customerId || undefined,
    });
    saveMovements(movements);

    // Ledger integration for customer
    if (customerId && remaining > 0) {
      const ledger = getLedgerEntries();
      ledger.unshift({
        id: `l${Date.now()}`,
        entityId: customerId,
        entityType: "customer",
        type: "debit",
        amount: remaining,
        description: `Stock Out: ${qty} ${product.unit} of ${product.name} — outstanding`,
        date: new Date().toISOString().split("T")[0],
      });
      saveLedgerEntries(ledger);

      const allCustomers = getCustomers();
      const updatedCustomers = allCustomers.map((c) =>
        c.id === customerId ? { ...c, totalCredit: c.totalCredit + remaining } : c
      );
      saveCustomers(updatedCustomers);
    }
    if (customerId && Number(paidAmount) > 0) {
      const ledger = getLedgerEntries();
      ledger.unshift({
        id: `l${Date.now() + 1}`,
        entityId: customerId,
        entityType: "customer",
        type: "credit",
        amount: Number(paidAmount),
        description: `Payment for Stock Out: ${product.name}`,
        date: new Date().toISOString().split("T")[0],
      });
      saveLedgerEntries(ledger);

      const allCustomers = getCustomers();
      const updatedCustomers = allCustomers.map((c) =>
        c.id === customerId ? { ...c, totalPaid: c.totalPaid + Number(paidAmount) } : c
      );
      saveCustomers(updatedCustomers);
    }

    toast.success(`Removed ${qty} ${product.unit} of ${product.name}`);
    setProductId("");
    setQuantity("");
    setCustomerId("");
    setNote("");
    setPaidAmount("");
    setTxStatus("unpaid");
  };

  const recentMovements = getMovements().filter((m) => m.type === "out").slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Stock Out</h1>
        <p className="text-muted-foreground text-sm">Record outgoing inventory / sales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowUpFromLine className="h-4 w-4 text-warning" /> Remove Stock</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label>Product</Label>
                  <Select value={productId} onValueChange={setProductId} required>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Customer (optional)</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Note</Label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Walk-in sale" />
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="space-y-1">
                    <Label>Total Amount (PKR)</Label>
                    <Input type="number" value={totalAmount} readOnly className="bg-muted" />
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

                <Button type="submit" className="w-full">Record Stock Out</Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Outbound</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{m.productName}</p>
                      <p className="text-xs text-muted-foreground">{m.note} · {m.date}</p>
                    </div>
                    <span className="text-sm font-mono font-medium text-warning">-{m.quantity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stock Out</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to remove {quantity} units of {selectedProduct?.name || "product"}. Total: ₨ {totalAmount.toLocaleString()}, Paid: ₨ {(Number(paidAmount) || 0).toLocaleString()}, Remaining: ₨ {remaining.toLocaleString()}. Do you want to proceed?
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

export default StockOut;
