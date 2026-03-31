import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, 
  FileText, Users, Truck, BarChart3, Settings, LogOut 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/stock-in", icon: ArrowDownToLine, label: "Stock In" },
  { to: "/stock-out", icon: ArrowUpFromLine, label: "Stock Out" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/suppliers", icon: Truck, label: "Suppliers" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary-foreground font-heading tracking-tight">
          <span className="text-sidebar-primary">A One</span> Paints
        </h1>
        <p className="text-xs text-sidebar-muted mt-0.5">Inventory & Ledger</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
