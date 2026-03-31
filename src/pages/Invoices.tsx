import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Printer, Trash2 } from "lucide-react";
import { getInvoices, saveInvoices, getCustomers, getProducts, getLedgerEntries, saveLedgerEntries, saveCustomers, Invoice } from "@/stores/inventoryStore";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(getInvoices);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: string }[]>([{ productId: "", quantity: "1" }]);
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [status, setStatus] = useState<"paid" | "partial" | "unpaid">("unpaid");
  const customers = getCustomers();
  const products = getProducts();

  const remaining = useMemo(() => {
    const t = Number(totalAmount) || 0;
    const p = Number(paidAmount) || 0;
    return Math.max(0, t - p);
  }, [totalAmount, paidAmount]);

  const addItem = () => setItems([...items, { productId: "", quantity: "1" }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const resetForm = () => {
    setCustomerId("");
    setItems([{ productId: "", quantity: "1" }]);
    setTotalAmount("");
    setPaidAmount("");
    setStatus("unpaid");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    if (!totalAmount || Number(totalAmount) <= 0) { toast.error("Enter a valid total amount"); return; }
    setConfirmOpen(true);
  };

  const handleConfirmCreate = () => {
    setConfirmOpen(false);
    const customer = customers.find((c) => c.id === customerId)!;

    const invoiceItems = items.filter((it) => it.productId).map((it) => {
      const prod = products.find((p) => p.id === it.productId)!;
      return { productId: prod.id, productName: prod.name, quantity: Number(it.quantity), price: prod.price };
    });

    const total = Number(totalAmount);
    const paid = Number(paidAmount) || 0;

    const newInvoice: Invoice = {
      id: `inv${Date.now()}`,
      invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, "0")}`,
      customerId,
      customerName: customer.name,
      items: invoiceItems,
      total,
      date: new Date().toISOString().split("T")[0],
      status,
      amountPaid: paid,
    };

    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);

    // Ledger integration for customer
    if (remaining > 0) {
      const ledger = getLedgerEntries();
      ledger.unshift({
        id: `l${Date.now()}`,
        entityId: customerId,
        entityType: "customer",
        type: "debit",
        amount: remaining,
        description: `Invoice ${newInvoice.invoiceNumber} — outstanding balance`,
        date: new Date().toISOString().split("T")[0],
      });
      saveLedgerEntries(ledger);

      const allCustomers = getCustomers();
      const updatedCustomers = allCustomers.map((c) =>
        c.id === customerId ? { ...c, totalCredit: c.totalCredit + remaining } : c
      );
      saveCustomers(updatedCustomers);
    }
    if (paid > 0) {
      const ledger = getLedgerEntries();
      ledger.unshift({
        id: `l${Date.now() + 1}`,
        entityId: customerId,
        entityType: "customer",
        type: "credit",
        amount: paid,
        description: `Payment for Invoice ${newInvoice.invoiceNumber}`,
        date: new Date().toISOString().split("T")[0],
      });
      saveLedgerEntries(ledger);
    }

    setOpen(false);
    resetForm();
    toast.success(`Invoice ${newInvoice.invoiceNumber} created`);
  };

  const handlePrint = (inv: Invoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const customer = customers.find((c) => c.id === inv.customerId);
    printWindow.document.write(`
      <html><head><title>Invoice ${inv.invoiceNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#1a1a1a}
      h1{font-size:24px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}
      .total{font-size:18px;font-weight:bold;text-align:right;margin-top:16px}
      .credit{color:#e67e22;margin-top:8px;text-align:right}</style></head><body>
      <h1>Invoice: ${inv.invoiceNumber}</h1>
      <p>Date: ${inv.date}</p>
      <p>Customer: ${inv.customerName}</p>
      ${customer ? `<p>Phone: ${customer.phone}</p>` : ""}
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${inv.items.map((it) => `<tr><td>${it.productName}</td><td>${it.quantity}</td><td>₨ ${it.price}</td><td>₨ ${it.quantity * it.price}</td></tr>`).join("")}</tbody></table>
      <div class="total">Grand Total: ₨ ${inv.total.toLocaleString()}</div>
      <div class="total">Paid: ₨ ${inv.amountPaid.toLocaleString()}</div>
      ${inv.total - inv.amountPaid > 0 ? `<div class="credit">Balance Due: ₨ ${(inv.total - inv.amountPaid).toLocaleString()}</div>` : ""}
      <script>window.print()</script></body></html>
    `);
  };

  const statusColor = (s: string) => s === "paid" ? "default" : s === "partial" ? "secondary" : "destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Invoices</h1>
          <p className="text-muted-foreground text-sm">{invoices.length} invoices</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Invoice</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId} required>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Items</Label>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Select value={item.productId} onValueChange={(v) => { const n = [...items]; n[i].productId = v; setItems(n); }}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Product" /></SelectTrigger>
                      <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — ₨{p.price}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => { const n = [...items]; n[i].quantity = e.target.value; setItems(n); }} className="w-20" />
                    {items.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Total Amount (PKR)</Label>
                  <Input type="number" min="0" required value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0" />
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
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as "paid" | "partial" | "unpaid")} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full">Create Invoice</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Invoice Creation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create an invoice for ₨ {Number(totalAmount || 0).toLocaleString()} with ₨ {Number(paidAmount || 0).toLocaleString()} paid. Status: {status}. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Paid</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4 font-mono font-medium">{inv.invoiceNumber}</td>
                      <td className="p-4">{inv.customerName}</td>
                      <td className="p-4 text-muted-foreground">{inv.date}</td>
                      <td className="p-4 text-right font-mono">₨ {inv.total.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono">₨ {inv.amountPaid.toLocaleString()}</td>
                      <td className="p-4"><Badge variant={statusColor(inv.status)}>{inv.status}</Badge></td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(inv)}><Printer className="h-4 w-4" /></Button>
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

export default Invoices;
