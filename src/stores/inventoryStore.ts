// Local storage based store for inventory data

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  minStock: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out";
  quantity: number;
  date: string;
  note: string;
  supplierId?: string;
  customerId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOwed: number;
  totalPaid: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalCredit: number;
  totalPaid: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: { productId: string; productName: string; quantity: number; price: number }[];
  total: number;
  date: string;
  status: "paid" | "unpaid" | "partial";
  amountPaid: number;
}

export interface LedgerEntry {
  id: string;
  entityId: string;
  entityType: "supplier" | "customer";
  type: "debit" | "credit";
  amount: number;
  description: string;
  date: string;
}

const getStore = <T>(key: string, fallback: T[]): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
};

const setStore = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Products
export const getProducts = (): Product[] => getStore("products", []);
export const saveProducts = (p: Product[]) => setStore("products", p);

// Stock Movements
export const getMovements = (): StockMovement[] => getStore("movements", []);
export const saveMovements = (m: StockMovement[]) => setStore("movements", m);

// Suppliers
export const getSuppliers = (): Supplier[] => getStore("suppliers", []);
export const saveSuppliers = (s: Supplier[]) => setStore("suppliers", s);

// Customers
export const getCustomers = (): Customer[] => getStore("customers", []);
export const saveCustomers = (c: Customer[]) => setStore("customers", c);

// Invoices
export const getInvoices = (): Invoice[] => getStore("invoices", []);
export const saveInvoices = (i: Invoice[]) => setStore("invoices", i);

// Ledger
export const getLedgerEntries = (): LedgerEntry[] => getStore("ledger", []);
export const saveLedgerEntries = (l: LedgerEntry[]) => setStore("ledger", l);
