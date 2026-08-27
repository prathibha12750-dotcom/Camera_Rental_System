import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const PhotographerHome = () => {
  const { user } = useAuth();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-gray-950 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
            Photographer dashboard
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Welcome, {user?.name}.
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-gray-300">
            Your profile, portfolio, availability and photography bookings
            will appear here.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {/* Profile */}
          <Link
            to="/photographer/profile"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              P
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Profile
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Manage your photographer profile and professional information.
            </p>
          </Link>

          {/* Portfolio */}
          <Link
            to="/photographer/portfolio"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              Po
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Portfolio
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Showcase your photography work and manage your portfolio items.
            </p>
          </Link>
          
          {/* Availability */}
          <Link
            to="/photographer/availability"
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
              A
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-950">
              Availability
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Set your availability for photography bookings and manage your schedule.
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
              Review and manage customer photography bookings.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PhotographerHome;