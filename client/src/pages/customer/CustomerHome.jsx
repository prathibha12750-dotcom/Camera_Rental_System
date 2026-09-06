import { useAuth } from "../../context/useAuth";

// linked equipment route by thasindu ================
import { Link } from "react-router-dom";

import { useNavigate } from "react-router-dom";
// ======================================================

const CustomerHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-gray-950 p-8 text-white shadow-xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
            Customer dashboard
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Welcome, {user?.name}.
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-300">
            Your equipment rentals, photographer bookings and account features will appear here.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {[
            ["Equipment", "Browse and rent camera equipment.", "/customer/equipment"],
            ["Photographers", "Discover professionals for your next shoot."],
            ["Bookings", "Track your upcoming rental and photography bookings."],
          ].map(([title, description]) => (
              // ==================================================================================
              // make card clickable by thasindu ===========
              <div
                  key={title}
                  onClick={() => {
                    if (title === "Equipment") {
                      navigate("/customer/equipment");
                    }

                    if (title === "Bookings") {
                      navigate("/customer/rentals");
                    }
                  }}
                  className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${
                    title === "Equipment"|| title === "Bookings"
                    ? "cursor-pointer transition hover:-translate-y-1 hover:shadow-md"
                    : ""
                  }`}
              >
              

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
                {title.charAt(0)}
              </div>
              <h2 className="mt-5 text-lg font-semibold text-gray-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default CustomerHome;
