
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const AdminLayout = () => {
  const { user } = useAuth();

  const navigation = [
    { name: "Dashboard", path: "/admin" },
    { name: "Users", path: "/admin/users" },
    { name: "Invoices", path: "/admin/invoices" },
    { name: "Payments", path: "/admin/payments" },
    { name: "Deposits", path: "/admin/deposits" },
    { name: "Refunds", path: "/admin/refunds" },
    { name: "Reports", path: "/admin/reports" },
    { name: "Notifications", path: "/admin/notifications" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 bg-gray-950 text-white md:block">
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
            <nav className="flex-1 space-y-1 px-4 py-6">
              {navigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-orange-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

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

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
            <div>
              <h2 className="font-semibold text-gray-950">
                Staff Admin
              </h2>

              <p className="text-xs text-gray-500">
                Management Portal
              </p>
            </div>

            <div className="text-sm text-gray-600">
              {user?.name || "Admin"}
            </div>
          </header>

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