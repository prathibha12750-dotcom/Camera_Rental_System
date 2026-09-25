import { Link } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

const ClerkHome = () => {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">

          <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
            Clerk Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-black text-gray-950">
            Welcome, {user?.name}
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Manage day-to-day equipment rental operations,
            returns, inspections, overdue rentals, and
            equipment damage records.
          </p>

        </div>

        {/* Operational Modules */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">

          {/* Rental Management */}
          <Link
            to="/clerk/rentals"
            className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-xl">
              📷
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950 transition group-hover:text-orange-600">
              Rental Management
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review rental requests, issue equipment,
              process returns, monitor overdue rentals,
              and complete rental transactions.
            </p>

            <span className="mt-5 inline-flex font-semibold text-orange-600">
              Manage Rentals →
            </span>
          </Link>

          {/* Damage Management */}
          <Link
            to="/clerk/rentals"
            className="group rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-xl">
              🛠️
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950 transition group-hover:text-orange-600">
              Damage & Maintenance
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review reported equipment damage,
              start inspections, send equipment to
              maintenance, and mark repairs as resolved.
            </p>

            <span className="mt-5 inline-flex font-semibold text-orange-600">
              View Damage Records →
            </span>
          </Link>

        </div>

      </div>
    </main>
  );
};

export default ClerkHome;