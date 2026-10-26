
import { Outlet } from "react-router-dom";

// Admin pages use the shared AppLayout,
// AppSidebar, and AppHeader components.
// This prevents duplicate sidebars and headers.

const AdminLayout = () => {
  return <Outlet />;
};

export default AdminLayout;
