
import { Link } from "react-router-dom";

import heroImage from "../assets/hero.jpg";
import cameraImage from "../assets/camera.jpg";
import photographerImage from "../assets/photographer.jpg";
import studioImage from "../assets/studio.jpg";

const services = [
  {
    title: "Camera Equipment Rental",
    description:
      "Explore cameras, lenses, and supporting photography equipment for different creative projects.",
    image: cameraImage,
  },
  {
    title: "Photographer Booking",
    description:
      "Discover photographers, review portfolios and service packages, and request bookings for your preferred dates.",
    image: photographerImage,
  },
  {
    title: "Studio & Creative Equipment",
    description:
      "Find supporting equipment and creative tools to help plan your next photography or production project.",
    image: studioImage,
  },
];

const benefits = [
  {
    number: "01",
    title: "Convenient Discovery",
    description:
      "Explore equipment and photography services from one platform.",
  },
  {
    number: "02",
    title: "Clear Booking Process",
    description:
      "Review available information and submit rental or photographer booking requests.",
  },
  {
    number: "03",
    title: "Booking Management",
    description:
      "Registered customers can review their requests and track booking updates.",
  },
  {
    number: "04",
    title: "Rental Transparency",
    description:
      "Access rental details, invoices, and relevant payment information.",
  },
];

export default function AboutUs() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* HERO SECTION */}
      <section className="relative isolate flex min-h-[440px] items-center overflow-hidden bg-gray-950 py-24 text-white md:min-h-[540px]">
        <img
          src={heroImage}
          alt="Photography equipment"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950/95 via-gray-950/80 to-gray-950/40" />

        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
              About Southern Camera Rent
            </p>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your Creative Journey
              <span className="block text-orange-400">
                Starts Here.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-gray-200 sm:text-lg">
              Discover photography equipment and connect
              with photographers through one convenient
              platform designed around your creative needs.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
            <a
            href="/#equipment"
            className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
            >
            Explore Equipment
            </a>

              <Link
                to="/photographers"
                className="rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Find Photographers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            Who We Are
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Bringing Equipment and Creative Talent Together
          </h2>

          <p className="mt-6 leading-8 text-gray-600">
            Southern Camera Rent is a camera equipment
            rental business. This demonstration platform
            brings equipment discovery, rental requests,
            and photographer booking services together
            in one digital experience.
          </p>

          <p className="mt-4 leading-8 text-gray-600">
            Whether you are planning a personal shoot,
            an event, or a creative production, the
            platform helps you explore relevant
            equipment and photography services.
          </p>
        </div>

        <div className="relative">
          <img
            src={cameraImage}
            alt="Camera equipment"
            className="h-[360px] w-full rounded-3xl object-cover shadow-xl sm:h-[430px]"
          />

          <div className="absolute -bottom-5 left-5 rounded-2xl bg-gray-950 px-6 py-5 text-white shadow-xl sm:left-8">
            <p className="text-xl font-black text-orange-400">
              SCR
            </p>
            <p className="mt-1 text-xs text-gray-300">
              Equipment & Photographer Services
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-gray-50 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              What We Offer
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Services for Your Creative Needs
            </h2>

            <p className="mt-4 leading-7 text-gray-600">
              Explore the main services available through
              our camera rental and photographer booking
              platform.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />

                <div className="p-7">
                  <h3 className="text-xl font-bold text-gray-950">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    {service.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE SCR */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            Why Choose SCR
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            A Simpler Way to Plan Your Next Shoot
          </h2>

          <p className="mt-4 leading-7 text-gray-600">
            Our demonstration platform is designed to
            make equipment rental and photographer
            discovery easier to understand and manage.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div
              key={benefit.number}
              className="rounded-2xl border border-gray-200 p-7 transition hover:border-orange-200 hover:bg-orange-50/40"
            >
              <span className="text-sm font-black text-orange-600">
                {benefit.number}
              </span>

              <h3 className="mt-4 text-lg font-bold">
                {benefit.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-gray-600">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* BUSINESS STORY */}
      <section className="bg-gray-950 py-20 text-white lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-8">
          <img
            src={studioImage}
            alt="Photography studio environment"
            className="h-[340px] w-full rounded-3xl object-cover lg:h-[430px]"
            loading="lazy"
          />

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
              Our Story
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Built Around a Passion for Photography
            </h2>

            <p className="mt-6 leading-8 text-gray-300">
              Southern Camera Rent's verified business
              history and background will be presented
              here once the official information is
              provided by the business.
            </p>

            <p className="mt-4 text-sm leading-7 text-gray-400">
              This section currently contains
              demonstration placeholder content.
            </p>
          </div>
        </div>
      </section>

      {/* VISION AND MISSION */}
      <section className="bg-orange-50/50 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              Our Direction
            </p>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Vision & Mission
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Proposed statements for the university
              demonstration — not official SCR statements.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm sm:p-10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl text-orange-700">
                ◎
              </div>

              <h3 className="text-2xl font-black">
                Our Vision
              </h3>

              <p className="mt-4 leading-8 text-gray-600">
                To make photography equipment and
                professional photography services more
                accessible through a convenient and
                connected digital experience.
              </p>
            </article>

            <article className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm sm:p-10">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-xl text-orange-700">
                ◈
              </div>

              <h3 className="text-2xl font-black">
                Our Mission
              </h3>

              <p className="mt-4 leading-8 text-gray-600">
                To simplify equipment discovery, rental
                requests, and photographer bookings
                through a clear and user-friendly
                platform.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CONTACT CALL TO ACTION */}
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gray-950 px-7 py-14 text-center text-white sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
            Connect With Us
          </p>

          <h2 className="mt-4 text-3xl font-black sm:text-4xl">
            Ready to Plan Your Next Project?
          </h2>

        <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-300">
        Explore camera equipment, discover photographers,
        or contact our team for assistance with your
        next photography project.
        </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/photographers"
              className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold transition hover:bg-orange-700"
            >
              Explore Photographers
            </Link>

            <Link
            to="/contact"
            className="rounded-xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:border-orange-400 hover:bg-white/10"
            >
            Contact Us
            </Link>

          </div>
        </div>
      </section>
    </main>
  );
}
