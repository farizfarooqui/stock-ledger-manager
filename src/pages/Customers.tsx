import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Phone, MapPin } from "lucide-react";
import { getCustomers, saveCustomers, getLedgerEntries, Customer } from "@/stores/inventoryStore";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>(getCustomers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ledger = getLedgerEntries().filter((l) => l.entityType === "customer");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = { id: `c${Date.now()}`, ...form, totalCredit: 0, totalPaid: 0 };
    const updated = [...customers, newCustomer];
    setCustomers(updated);
    saveCustomers(updated);
    setOpen(false);
    setForm({ name: "", phone: "", address: "" });
    toast.success("Customer added");
  };

  const selectedLedger = selectedId ? ledger.filter((l) => l.entityId === selectedId) : [];
  const selectedCustomer = customers.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage customer accounts & khata</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Customer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <Button type="submit" className="w-full">Add Customer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {customers.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`cursor-pointer transition-colors ${selectedId === c.id ? "ring-2 ring-primary" : "hover:bg-muted/50"}`} onClick={() => setSelectedId(c.id)}>
                <CardContent className="p-4">
                  <h3 className="font-medium">{c.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><Phone className="h-3 w-3" />{c.phone}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{c.address}</div>
                  <div className="flex justify-between mt-3 text-sm">
                    <span className="text-warning font-mono">Credit: ₨ {c.totalCredit.toLocaleString()}</span>
                    <span className="text-accent font-mono">Paid: ₨ {c.totalPaid.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader><CardTitle className="text-base">Khata / Ledger {selectedCustomer && `— ${selectedCustomer.name}`}</CardTitle></CardHeader>
            <CardContent>
              {!selectedId ? (
                <p className="text-sm text-muted-foreground text-center py-8">Select a customer to view their ledger</p>
              ) : selectedLedger.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No ledger entries yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedLedger.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">{entry.date}</p>
                      </div>
                      <span className={`text-sm font-mono font-medium ${entry.type === "debit" ? "text-warning" : "text-accent"}`}>
                        {entry.type === "debit" ? "-" : "+"}₨ {entry.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Customers;
