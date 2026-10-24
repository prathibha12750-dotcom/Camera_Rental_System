
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
//added by abilash
import { useState } from "react";
//ended by abilash

/* added by abilash */
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Camera,
  Tags,
  ClipboardList,
  FileText,
  CreditCard,
  Wallet,
  RotateCcw,
  BarChart3,
  Activity,
  Bell,
  UserRound,
  Menu
} from "lucide-react";
/* ended by abilash */


const AdminLayout = () => {
  
  //added by abilash
  // Icons for Admin sidebar navigation
  const navigationIcons = {
    "/admin": LayoutDashboard,
    "/admin/users": Users,
    "/admin/photographer-applications": UserCheck,
    "/admin/equipment": Camera,
    "/admin/categories": Tags,
    "/admin/rentals": ClipboardList,
    "/admin/invoices": FileText,
    "/admin/payments": CreditCard,
    "/admin/deposits": Wallet,
    "/admin/refunds": RotateCcw,
    "/admin/reports": BarChart3,
    "/admin/activity-logs": Activity,
    "/admin/notifications": Bell,
    "/admin/profile": UserRound,
  };
  //ended by abilash

  const { user } = useAuth();
  
  //added by abilash
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  //ended by abilash



  //added by abilash
  // Organized Admin Sidebar Navigation
  const navigation = [
    {
      title: "OVERVIEW",
      items: [
        { name: "Dashboard", path: "/admin" },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { name: "Users", path: "/admin/users" },
        {
          name: "Photographer Applications",
          path: "/admin/photographer-applications",
        },
        { name: "Equipment", path: "/admin/equipment" },
        { name: "Categories", path: "/admin/categories" },
        { name: "Rentals", path: "/admin/rentals" },
      ],
    },
    {
      title: "BILLING & FINANCE",
      items: [
        { name: "Invoices", path: "/admin/invoices" },
        { name: "Payments", path: "/admin/payments" },
        { name: "Deposits", path: "/admin/deposits" },
        { name: "Refunds", path: "/admin/refunds" },
      ],
    },
    {
      title: "MONITORING",
      items: [
        { name: "Reports", path: "/admin/reports" },
        {
          name: "System Activity Logs",
          path: "/admin/activity-logs",
        },
        { name: "Notifications", path: "/admin/notifications" },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { name: "My Profile", path: "/admin/profile" },
      ],
    },
  ];
  //ended by abilash


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        
        {/* added by abilash */}
        <aside
          id="admin-sidebar"
          className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-gray-950 text-white shadow-xl transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 md:shadow-none ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
        {/* ended by abilash */}

          <div className="sticky top-0 flex h-screen flex-col">
 
            {/* Logo / Brand */}
            <div className="border-b border-gray-800 px-6 py-6">
              <Link to="/admin">
                <h1 className="text-xl font-bold">
                  Camera<span className="text-orange-500">Rent</span>
                </h1>

                <p className="mt-1 text-xs text-gray-400">
                  Staff Admin Portal
                </p>
              </Link>
            </div>

            {/* Navigation */}

            {/* added by abilash */}
            {/* Grouped and Scrollable Admin Navigation */}

            <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
              {navigation.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
                    {section.title}
                  </p>

                  <div className="space-y-1">

                    {/* added by abilash */}
                    {section.items.map((item) => {
                      const Icon = navigationIcons[item.path] || LayoutDashboard;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === "/admin"}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? "bg-orange-600 text-white shadow-sm"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`
                          }
                        >
                          <Icon
                            className="h-[18px] w-[18px] shrink-0"
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />

                          <span className="min-w-0 truncate">
                            {item.name}
                          </span>
                        </NavLink>
                      );
                    })}
                    {/* ended by abilash */}

                  </div>
                </div>
              ))}
            </nav>

            {/* ended by abilash */}


            {/* User information */}
            <div className="border-t border-gray-800 p-4">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "Staff Admin"}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                STAFF_ADMIN
              </p>
            </div>

          </div>
        </aside>

                
        {/* added by abilash */}
        {/* Mobile sidebar backdrop */}
        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="Close Admin navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
        {/* ended by abilash */}


        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Header */}
          
          {/* added by abilash */}
          {/* Responsive Admin Header */}
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">

            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Admin navigation"
                aria-expanded={mobileMenuOpen}
                aria-controls="admin-sidebar"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Staff Admin
                </h2>

                <p className="text-xs text-slate-500">
                  Management Portal
                </p>
              </div>
            </div>

            <div className="max-w-[35%] truncate text-right text-xs text-slate-600 sm:text-sm">
              {user?.name || "Admin"}
            </div>

          </header>
          {/* ended by abilash */}


          {/* Page content */}
          <main className="flex-1">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
};

export default AdminLayout;