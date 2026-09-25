import { useAuth } from "../../context/useAuth";

const ClerkHome = () => {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

          <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
            Clerk Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-black text-gray-950">
            Welcome, {user?.name}
          </h1>

          <p className="mt-3 text-gray-600">
            Manage equipment rental operations,
            returns, inspections, and damage records.
          </p>

        </div>

      </div>
    </main>
  );
};

export default ClerkHome;