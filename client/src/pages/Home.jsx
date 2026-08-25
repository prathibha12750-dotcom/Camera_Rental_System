import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import heroImage from "../assets/hero.jpg";
import cameraImage from "../assets/camera.jpg";
import lensImage from "../assets/lens.jpg";
import photographerImage from "../assets/photographer.jpg";
import studioImage from "../assets/studio.jpg";
import equipmentImage from "../assets/equipment.jpg";
import photographer1Image from "../assets/photographer1.jpg";
import photographer2Image from "../assets/photographer2.jpg";

const dashboardRoutes = {
  CUSTOMER: "/customer",
  PHOTOGRAPHER: "/photographer",
  STAFF_ADMIN: "/admin",
};

const images = {
  hero: heroImage,
  camera: cameraImage,
  lens: lensImage,
  photographer: photographerImage,
  studio: studioImage,
  equipment: equipmentImage,
  photographer1: photographer1Image,
  photographer2: photographer2Image,
};

const Home = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const dashboardPath = dashboardRoutes[user?.role];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gray-50">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-orange-100 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-orange-50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Professional Photography Solutions
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight text-gray-950 md:text-6xl">
              Capture moments.
              <span className="block text-orange-600">Create memories.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Rent professional camera equipment and connect with experienced
              photographers through one simple platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {loading ? (
                <div className="h-12 w-40 animate-pulse rounded-xl bg-gray-200" aria-hidden="true" />
              ) : isAuthenticated ? (
                dashboardPath && (
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-orange-700"
                  >
                    Go to Dashboard <span className="ml-2">→</span>
                  </Link>
                )
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-orange-700"
                  >
                    Get Started <span className="ml-2">→</span>
                  </Link>

                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3.5 font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="mt-12 flex gap-8 border-t border-gray-200 pt-8 sm:gap-12">
              <div>
                <p className="text-2xl font-bold text-gray-950">150+</p>
                <p className="mt-1 text-sm text-gray-500">Equipment Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-950">50+</p>
                <p className="mt-1 text-sm text-gray-500">Photographers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-950">24/7</p>
                <p className="mt-1 text-sm text-gray-500">Online Booking</p>
              </div>
            </div>
          </div>

          {/* Real hero image */}
          <div className="relative">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-200/60 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-orange-100 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl bg-gray-950 shadow-2xl">
              <img
                src={images.hero}
                alt="Professional camera equipment"
                className="aspect-[4/3] w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-gray-950/65 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Professional equipment</p>
                    <p className="mt-1 text-xs text-gray-300">
                      Cameras, lenses and accessories ready for your next shoot.
                    </p>
                  </div>
                  <div className="shrink-0 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-300">
                    Available
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
              Everything you need
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
              Everything for your next shoot
            </h2>
            <p className="mt-4 leading-7 text-gray-600">
              From professional equipment rentals to photographer bookings,
              manage your photography needs in one place.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Camera Equipment",
                text: "Browse cameras, lenses, lighting equipment and professional photography gear.",
                image: images.camera,
              },
              {
                title: "Professional Photographers",
                text: "Discover photographers, explore portfolios and find the right professional for your event.",
                image: images.photographer,
              },
              {
                title: "Simple Booking",
                text: "Check availability, request rentals and manage your bookings through one simple system.",
                image: images.studio,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-semibold text-gray-950">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-gray-600">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= EQUIPMENT ================= */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
                Professional Equipment
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                The right equipment
                <span className="block">for every shot.</span>
              </h2>
              <p className="mt-5 max-w-xl leading-7 text-gray-600">
                Whether you're shooting a wedding, commercial project, portrait
                session or creating content, find the equipment you need without
                the cost of purchasing it.
              </p>

              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="mt-8 inline-flex items-center rounded-xl bg-gray-950 px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800"
                >
                  Browse Equipment <span className="ml-2">→</span>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={images.camera}
                  alt="Camera equipment"
                  loading="lazy"
                  className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-8 group overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={images.lens}
                  alt="Professional camera lens"
                  loading="lazy"
                  className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="group overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={images.studio}
                  alt="Photography studio equipment"
                  loading="lazy"
                  className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="mt-8 group overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={images.equipment}
                  alt="Photographer working with camera equipment"
                  loading="lazy"
                  className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PHOTOGRAPHERS ================= */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
                Find your photographer
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                Turn your ideas into memories
              </h2>
              <p className="mt-5 max-w-xl leading-7 text-gray-600">
                Connect with talented photographers who specialize in weddings,
                portraits, events, commercial photography and more.
              </p>

              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="mt-8 inline-flex items-center rounded-xl bg-orange-600 px-7 py-3.5 font-semibold text-white transition hover:bg-orange-700"
                >
                  Find a Photographer <span className="ml-2">→</span>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <img
                src={images.photographer1}
                alt="Photographer with camera"
                loading="lazy"
                className="h-72 w-full rounded-2xl object-cover shadow-sm"
              />
              <img
                src={images.photographer2}
                alt="Photographer with camera"
                loading="lazy"
                className="mt-10 h-72 w-full rounded-2xl object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      {!isAuthenticated && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gray-950 px-8 py-16 text-center md:px-16">
            <div className="mx-auto max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                Get started today
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                Ready to create something amazing?
              </h2>
              <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-400">
                Get access to professional equipment and talented photographers
                through one convenient platform.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center rounded-xl bg-orange-600 px-7 py-3.5 font-semibold text-white transition hover:bg-orange-700"
              >
                Create Your Account <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-semibold text-gray-950">Camera Rental System</p>
            <p className="mt-1 text-sm text-gray-500">
              Camera Equipment Rental & Photographer Booking
            </p>
          </div>
          <p className="text-sm text-gray-500">© 2026 Camera Rental System. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
};

export default Home;
