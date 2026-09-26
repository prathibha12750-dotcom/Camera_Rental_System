import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const DashboardIcon = ({ name }) => {
  const commonProps = {
    className: "h-6 w-6",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    "aria-hidden": true,
  };

  if (name === "rentals") {
    return (
      <svg {...commonProps}>
        <path d="M7 3v3M17 3v3" />
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 14h3M13 14h3M8 17h3" />
      </svg>
    );
  }

  if (name === "maintenance") {
    return (
      <svg {...commonProps}>
        <path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z" />
      </svg>
    );
  }

  if (name === "equipment") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M8 6l1.5-2h5L16 6" />
        <circle cx="12" cy="12.5" r="3" />
      </svg>
    );
  }

  if (name === "deposits") {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 9h18M7 15h4" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M9 7H5V3" />
      <path d="M5 7a8 8 0 1 1-1 8" />
      <path d="M8 12h8M12 9l-3 3 3 3" />
    </svg>
  );
};

const ClerkHome = () => {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
            Clerk Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-950">
            Welcome, {user?.name}
          </h1>

          <p className="mt-3 max-w-2xl text-gray-600">
            Manage day-to-day equipment rental operations,
            returns, inspections, overdue rentals, and
            equipment damage records.
          </p>

        </div>

        {/* Operational Modules */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {/* Rental Management */}
          <Link
            to="/clerk/rentals"
            className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <DashboardIcon name="rentals" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950 transition group-hover:text-orange-600">
              Rental Management
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review rental requests, issue equipment,
              process returns, monitor overdue rentals,
              and complete rental transactions.
            </p>

            <span className="mt-auto inline-flex pt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
              Manage Rentals →
            </span>
          </Link>

          {/* Damage Management */}
          <Link
            to="/clerk/damage-maintenance"
            className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <DashboardIcon name="maintenance" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950 transition group-hover:text-orange-600">
              Damage & Maintenance
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review reported equipment damage,
              start inspections, send equipment to
              maintenance, and mark repairs as resolved.
            </p>

            <span className="mt-auto inline-flex pt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
              View Damage Records →
            </span>
          </Link>

          {/* Equipment Status */}
          <Link
            to="/clerk/equipment"
            className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <DashboardIcon name="equipment" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950 transition group-hover:text-orange-600">
              Equipment Status
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              View equipment availability, condition,
              rental status, pricing, and security
              deposit information.
            </p>

            <span className="mt-auto inline-flex pt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
              View Equipment →
            </span>
          </Link>

          {/* Security Deposits */}
          <Link
            to="/clerk/deposits"
            className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <DashboardIcon name="deposits" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950 transition group-hover:text-orange-600">
              Security Deposits
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Record customer security deposits,
              check required deposit amounts, and
              review deposit history.
            </p>

            <span className="mt-auto inline-flex pt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
              Manage Deposits →
            </span>
          </Link>

          {/* Refund Management */}
          <Link
            to="/clerk/refunds"
            className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <DashboardIcon name="refund" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-950 transition group-hover:text-orange-600">
              Refund Management
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Process security deposit refunds after rental returns
              and review customer refund history.
            </p>

            <span className="mt-auto inline-flex pt-5 text-sm font-semibold text-orange-600 transition group-hover:text-orange-700">
              Manage Refunds →
            </span>
          </Link>

        </div>

      </div>
    </main>
  );
};

export default ClerkHome;