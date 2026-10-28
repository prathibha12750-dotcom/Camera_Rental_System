
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Clock3,
  MessageCircle,
  ArrowUpRight,
  Camera,
} from "lucide-react";

// ==========================================
// FOOTER NAVIGATION
// ==========================================

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
  { label: "Equipment", to: "/customer/equipment" },
  { label: "Photographers", to: "/photographers" },
];

// ==========================================
// BUSINESS CONTACT INFORMATION
// ==========================================

const business = {
  name: "Southern Camera Rent",
  phone: "+94 70 255 2200",
  phoneLink: "tel:+94702552200",
  whatsappLink: "https://wa.me/94702552200",
  address: "No. 288/A, Kumarathunga Mawatha, Matara 81000, Sri Lanka",
  mapsLink:
    "https://www.google.com/maps/search/?api=1&query=No.%20288%2FA%20Kumarathunga%20Mawatha%20Matara%2081000",
  hours: "Monday – Sunday, 24 Hours",
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-300">
      {/* MAIN FOOTER */}
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:grid-cols-2 lg:grid-cols-4 lg:gap-10 lg:px-8">
        {/* BRAND */}
        <div className="lg:col-span-2">
          <Link
            to="/"
            className="inline-flex items-center gap-3 text-xl font-black text-white"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white">
              <Camera className="h-6 w-6" />
            </span>

            <span>Southern Camera Rent</span>
          </Link>

          <p className="mt-5 max-w-md text-sm leading-7 text-gray-400">
            Your destination for camera equipment rentals
            and photographer bookings. Explore equipment,
            discover photography professionals, and prepare
            for your next creative project.
          </p>

          {/* CONTACT ACTIONS */}
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={business.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Us
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-orange-500 hover:text-orange-400"
            >
              Contact Us
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Quick Links
          </h3>

          <ul className="mt-6 space-y-3">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="group inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-orange-400"
                >
                  <span>{link.label}</span>

                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* CONTACT DETAILS */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Get in Touch
          </h3>

          <div className="mt-6 space-y-5">
            {/* ADDRESS */}
            <a
              href={business.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3"
            >
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />

              <span className="text-sm leading-6 text-gray-400 transition group-hover:text-orange-400">
                {business.address}
              </span>
            </a>

            {/* PHONE */}
            <a
              href={business.phoneLink}
              className="group flex items-start gap-3"
            >
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />

              <span className="text-sm text-gray-400 transition group-hover:text-orange-400">
                {business.phone}
              </span>
            </a>

            {/* BUSINESS HOURS */}
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />

              <div>
                <p className="text-sm font-medium text-gray-300">
                  Open 24 Hours
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Monday – Sunday
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-center text-xs text-gray-500 md:flex-row md:items-center md:justify-between md:text-left lg:px-8">
          <p>
            © {year} Southern Camera Rent. All rights reserved.
          </p>

          <p>
            Camera Equipment Rental & Photographer Booking
          </p>
        </div>
      </div>
    </footer>
  );
}
