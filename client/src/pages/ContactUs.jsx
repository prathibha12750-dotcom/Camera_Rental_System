import { useState } from "react";
import api from "../services/api";
import {
  Mail,
  MapPin,
  Phone,
  Clock3,
  Send,
  Camera,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  inquiryType: "GENERAL",
  message: "",
};

const inquiryOptions = [
  { value: "GENERAL", label: "General Inquiry" },
  { value: "EQUIPMENT", label: "Equipment Rental" },
  { value: "PHOTOGRAPHER", label: "Photographer Booking" },
  { value: "PAYMENT", label: "Payments & Deposits" },
  { value: "OTHER", label: "Other Inquiry" },
];

export default function ContactUs() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (status !== "idle") {
      setStatus("idle");
      setFeedback("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (status === "loading") return;

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.message.trim()
    ) {
      setStatus("error");
      setFeedback("Please complete all required fields.");
      return;
    }

    if (form.message.trim().length < 10) {
      setStatus("error");
      setFeedback("Please enter at least 10 characters.");
      return;
    }

    setStatus("loading");
    setFeedback("");

    try {
      const response = await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        inquiryType: form.inquiryType,
        message: form.message.trim(),
      });

      if (response.data?.success) {
        setStatus("success");
        setFeedback(
          response.data.message ||
            "Your message has been sent successfully!"
        );

        setForm(initialForm);
      } else {
        setStatus("error");
        setFeedback(
          response.data?.message ||
            "Unable to send your message."
        );
      }
    } catch (error) {
      setStatus("error");

      setFeedback(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  const inputStyle =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* PAGE HEADER */}
      <section className="relative overflow-hidden bg-gray-950 px-6 py-20 text-center text-white sm:py-24">
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-orange-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
            Contact Southern Camera Rent
          </p>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Let's Get in Touch
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-gray-300">
            Have questions about camera equipment rentals,
            photographer bookings, or our services in Matara?
            Contact Southern Camera Rent — we're here to help
            with your photography needs.
          </p>
        </div>
      </section>

      {/* CONTACT INFORMATION & FORM */}
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
        {/* LEFT COLUMN */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
            Reach Out
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            We'd Love to Hear From You
          </h2>

          <p className="mt-5 leading-8 text-gray-600">
            Whether you need information about equipment
            availability or want to know more about
            photographer bookings, feel free to contact us.
          </p>

          <div className="mt-10 space-y-7">
            <ContactDetail
              icon={Mail}
              title="Email Address"
              value="Contact us using the inquiry form"
              description="Send us your questions and our team can respond by email."
            />

            <ContactDetail
              icon={Phone}
              title="Phone & WhatsApp"
              value="+94 70 255 2200"
              description="Alternative contact: +94 71 530 3114"
            />

            <ContactDetail
              icon={MapPin}
              title="Our Location"
              value="No. 288/A, Kumarathunga Mawatha"
              description="Matara 81000, Sri Lanka"
            />

            <ContactDetail
              icon={Clock3}
              title="Business Hours"
              value="Open 24 Hours"
              description="Monday – Sunday"
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="tel:+94702552200"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <Phone className="h-4 w-4" />
                Call Us
              </a>

              <a
                href="https://wa.me/94702552200"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-100"
              >
                <Phone className="h-4 w-4" />
                WhatsApp
              </a>

              <a
                href="https://www.google.com/maps/search/?api=1&query=No.%20288%2FA%20Kumarathunga%20Mawatha%20Matara%2081000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4" />
                Get Directions
              </a>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-orange-100 bg-orange-50 p-6">
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-orange-600" />
              <h3 className="font-bold text-gray-950">
                Photography Starts Here
              </h3>
            </div>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              Explore our camera equipment and photographer
              services to find what suits your next project.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-9">
          <div className="mb-8">
            <h2 className="text-2xl font-black">
              Send Us a Message
            </h2>

            <p className="mt-2 text-sm leading-7 text-gray-500">
              Fill out the form below and our team can
              review your inquiry.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Full Name *
                </label>

                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Your full name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  className={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-sm font-semibold"
                >
                  Email Address *
                </label>

                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={254}
                  required
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Phone Number (Optional)
                </label>

                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="+94 XX XXX XXXX"
                  autoComplete="tel"
                  maxLength={25}
                  className={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-type"
                  className="mb-2 block text-sm font-semibold"
                >
                  Inquiry Type *
                </label>

                <select
                  id="contact-type"
                  name="inquiryType"
                  value={form.inquiryType}
                  onChange={updateField}
                  required
                  className={inputStyle}
                >
                  {inquiryOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="mb-2 block text-sm font-semibold"
              >
                Your Message *
              </label>

              <textarea
                id="contact-message"
                name="message"
                rows={6}
                value={form.message}
                onChange={updateField}
                placeholder="Tell us how we can help you..."
                minLength={10}
                maxLength={2000}
                required
                className={`${inputStyle} resize-y`}
              />

              <p className="mt-2 text-right text-xs text-gray-400">
                {form.message.length}/2000 characters
              </p>
            </div>

            {feedback && (
              <div
                role="status"
                className={`flex items-start gap-3 rounded-xl p-4 text-sm ${
                status === "error"
                  ? "bg-red-50 text-red-700"
                  : status === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-orange-50 text-orange-800"
                }`}
              >
                {status === "error" ? (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                )}

                <p>{feedback}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Sending Message...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </button>

          <p className="text-center text-xs leading-6 text-gray-400">
            Your inquiry will be sent to Southern Camera Rental
            through our contact email service.
          </p>

          </form>
        </div>
      </section>

      {/* LOCATION & DIRECTIONS */}
      <section className="bg-gray-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* SECTION HEADER */}
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
              Find Our Location
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Visit Southern Camera Rent
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600">
              Find our camera rental location in Matara,
              Sri Lanka. Use the map below to explore
              the area or get directions.
            </p>
          </div>

          {/* MAP CONTAINER */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50">

          {/* INTERACTIVE MAP WITH FLOATING BUSINESS CARD */}
          <div className="relative">
            <iframe
              title="Southern Camera Rent Location"
              src="https://www.google.com/maps?q=No.%20288%2FA%20Kumarathunga%20Mawatha%20Matara%2081000%20Sri%20Lanka&output=embed"
              width="100%"
              className="block h-[320px] w-full sm:h-[400px] lg:h-[460px]"
            />

            {/* FLOATING LOCATION CARD */}
            <div className="pointer-events-none absolute left-5 top-5 hidden w-80 md:block">
              <div className="pointer-events-auto rounded-2xl border border-white/10 bg-gray-950/95 p-6 text-white shadow-2xl backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-6 w-6 shrink-0 text-orange-400" />

                  <div>
                    <h3 className="text-lg font-bold">
                      Southern Camera Rent
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      No. 288/A, Kumarathunga Mawatha,
                      Matara 81000, Sri Lanka
                    </p>
                  </div>
                </div>

                <div className="my-5 border-t border-white/10" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-orange-400" />
                    <span className="text-sm text-gray-200">
                      Open 24 Hours · Monday – Sunday
                    </span>
                  </div>

                  <a
                    href="tel:+94702552200"
                    className="flex items-center gap-3 text-sm text-gray-200 transition hover:text-orange-400"
                  >
                    <Phone className="h-5 w-5 text-orange-400" />
                    +94 70 255 2200
                  </a>
                </div>

                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=No.%20288%2FA%20Kumarathunga%20Mawatha%20Matara%2081000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                  <MapPin className="h-4 w-4" />
                  Get Directions
                </a>
              </div>
            </div>
          </div>

            {/* LOCATION DETAILS */}
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <h3 className="text-xl font-bold text-gray-950">
                  Southern Camera Rent
                </h3>

                <p className="mt-2 text-sm leading-7 text-gray-600">
                  No. 288/A, Kumarathunga Mawatha,
                  <br />
                  Matara 81000, Sri Lanka
                </p>

                <p className="mt-2 text-sm font-medium text-orange-600">
                  Open 24 Hours · Monday – Sunday
                </p>
              </div>

              <a
                href="https://www.google.com/maps/dir/?api=1&destination=No.%20288%2FA%20Kumarathunga%20Mawatha%20Matara%2081000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700"
              >
                <MapPin className="h-4 w-4" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-gray-50 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-black sm:text-3xl">
            Explore Our Services
          </h2>

          <p className="mt-4 leading-7 text-gray-600">
            Browse equipment and discover photographers
            available through our platform.
          </p>

          <a
            href="/"
            className="mt-7 inline-flex rounded-xl bg-gray-950 px-7 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
          >
            Explore Southern Camera Rent
          </a>
        </div>
      </section>
    </main>
  );
}

function ContactDetail({
  icon: Icon,
  title,
  value,
  description,
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h3 className="font-bold text-gray-950">{title}</h3>
        <p className="mt-1 text-sm font-medium text-gray-700">
          {value}
        </p>
        <p className="mt-1 text-xs leading-6 text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}
