import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const CustomerHome = () => {
  const { user } = useAuth();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Welcome Section */}
        <div className="rounded-3xl bg-gray-950 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
            Customer dashboard
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Welcome, {user?.name}.
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-gray-300">
            Your equipment rentals, photographer bookings and
            account features will appear here.
          </p>
        </div>


        {/* Dashboard Cards */}
        <div className="mt-6 grid gap-5 md:grid-cols-3">

          {/* Equipment */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              E
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Equipment
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Browse and rent camera equipment.
            </p>
          </div>


          {/* Photographers */}
          <Link
            to="/customer/photographers"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              P
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Photographers
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Browse photographers, view portfolios, check rates and availability.
            </p>
          </Link>


          {/* Bookings */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              B
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Bookings
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Track your upcoming rental and photography bookings.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
};

export default CustomerHome;