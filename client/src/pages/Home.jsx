import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import { useAuth } from "../context/useAuth";

import api from "../services/api";

import heroImage from "../assets/hero.jpg";
import cameraImage from "../assets/camera.jpg";
import lensImage from "../assets/lens.jpg";
import photographerImage from "../assets/photographer.jpg";
import studioImage from "../assets/studio.jpg";
import equipmentImage from "../assets/equipment.jpg";
import photographer1Image from "../assets/photographer1.jpg";
import photographer2Image from "../assets/photographer2.jpg";


// ==========================================
// DASHBOARD ROUTES
// ==========================================

const dashboardRoutes = {
  CUSTOMER: "/customer",
  PHOTOGRAPHER: "/photographer",
  STAFF_ADMIN: "/admin",
};


// ==========================================
// HERO SLIDES
// ==========================================

const heroSlides = [
  {
    id: 1,
    eyebrow: "Professional Camera Equipment",
    title: "Discover the gear",
    highlight: "for your next shoot.",
    description:
      "Explore cameras, lenses and supporting equipment available through Southern Camera Rent.",
    image: heroImage,
    primaryText: "Discover Equipment",
    primaryLink: "#equipment",
    secondaryText: "Login to Rent",
    secondaryLink: "/login",
  },

  {
    id: 2,
    eyebrow: "Photographer Discovery",
    title: "Find the right photographer",
    highlight: "for your special moment.",
    description:
      "Discover photographers, explore available photography services and find the right professional for your project.",
    image: photographerImage,
    primaryText: "Discover Photographers",
    primaryLink: "/photographers",
    secondaryText: "Login to Book",
    secondaryLink: "/login",
  },

  {
    id: 3,
    eyebrow: "Studio & Creative Gear",
    title: "Build the setup",
    highlight: "your project deserves.",
    description:
      "Explore studio equipment, lighting gear and creative tools for photography and production work.",
    image: studioImage,
    primaryText: "Explore Equipment",
    primaryLink: "/customer/equipment",
    secondaryText: "Create Account",
    secondaryLink: "/register",
  },

  {
    id: 4,
    eyebrow: "Southern Camera Rent",
    title: "Discover first.",
    highlight: "Rent or book after login.",
    description:
      "Public visitors can explore equipment and photographers. Register or sign in when you are ready to submit a rental or booking request.",
    image: cameraImage,
    primaryText: "Start Discovering",
    primaryLink: "#discover",
    secondaryText: "Register",
    secondaryLink: "/register",
  },
];


// ==========================================
// DISCOVERY CATEGORIES
// ==========================================

const categories = [
  {
    title: "Cameras",
    text:
      "Discover DSLR, mirrorless and video camera options available through the system.",
    image: cameraImage,
  },

  {
    title: "Lenses",
    text:
      "Explore lens options suitable for portraits, events, productions and creative work.",
    image: lensImage,
  },

  {
    title: "Studio Gear",
    text:
      "Discover lighting and supporting equipment for studio and location photography.",
    image: studioImage,
  },

  {
    title: "Photographers",
    text:
      "Discover professional photographers and learn about the photography services available.",
    image: photographerImage,
    link: "/photographers",
  },
];


// ==========================================
// HOME PAGE
// ==========================================

const Home = () => {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  const dashboardPath =
    dashboardRoutes[user?.role];

  const [
    currentSlide,
    setCurrentSlide,
  ] = useState(0);

  const [
    sliderPaused,
    setSliderPaused,
  ] = useState(false);

  const [
    featuredPhotographers,
    setFeaturedPhotographers,
  ] = useState([]);

  const [
    photographersLoading,
    setPhotographersLoading,
  ] = useState(true);


  // ==========================================
  // HERO SLIDER
  // ==========================================

  const nextSlide = () => {
    setCurrentSlide(
      (previous) =>
        previous ===
        heroSlides.length - 1
          ? 0
          : previous + 1
    );
  };


  const previousSlide = () => {
    setCurrentSlide(
      (previous) =>
        previous === 0
          ? heroSlides.length - 1
          : previous - 1
    );
  };


  useEffect(() => {
    if (sliderPaused) {
      return undefined;
    }

    const interval =
      setInterval(() => {
        setCurrentSlide(
          (previous) =>
            previous ===
            heroSlides.length - 1
              ? 0
              : previous + 1
        );
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [sliderPaused]);


  // ==========================================
  // LOAD FEATURED PHOTOGRAPHERS
  // ==========================================

  useEffect(() => {
    let ignore = false;

    const loadFeaturedPhotographers =
      async () => {
        try {
          const response =
            await api.get(
              "/customer/photographers"
            );

          const photographers =
            Array.isArray(
              response.data?.data
                ?.photographers
            )
              ? response.data.data
                  .photographers
              : [];

          if (!ignore) {
            setFeaturedPhotographers(
              photographers.slice(
                0,
                3
              )
            );
          }
        } catch (error) {
          console.error(
            "Failed to load featured photographers:",
            error
          );

          if (!ignore) {
            setFeaturedPhotographers(
              []
            );
          }
        } finally {
          if (!ignore) {
            setPhotographersLoading(
              false
            );
          }
        }
      };

    loadFeaturedPhotographers();

    return () => {
      ignore = true;
    };
  }, []);


  const slide =
    heroSlides[currentSlide];


  // ==========================================
  // PHOTOGRAPHER HELPERS
  // ==========================================

  const getPhotographerName = (
    photographer
  ) =>
    photographer?.user?.name ||
    photographer?.name ||
    "Photographer";


  const getPhotographerInitials = (
    photographer
  ) => {
    const name =
      getPhotographerName(
        photographer
      );

    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
          (part) =>
            part
              .charAt(0)
              .toUpperCase()
        )
        .join("") || "P"
    );
  };


  const getPhotographerImage = (
    photographer
  ) =>
    photographer?.profileImage ||
    photographer?.image ||
    "";


  const getPhotographerId = (
    photographer
  ) =>
    photographer?._id ||
    photographer?.id;


  return (
    <main className="min-h-screen bg-white text-gray-950">


      {/* ==========================================
          PROMOTIONAL HERO SLIDER
      ========================================== */}

      <section
        className="relative overflow-hidden bg-gray-950 text-white"
        onMouseEnter={() =>
          setSliderPaused(true)
        }
        onMouseLeave={() =>
          setSliderPaused(false)
        }
      >

        {/* SLIDE BACKGROUND */}

        <div className="absolute inset-0">

          <img
            key={slide.id}
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover opacity-50"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        </div>


        {/* SLIDE CONTENT */}

        <div className="relative mx-auto flex min-h-[640px] max-w-7xl items-center px-6 py-20 lg:min-h-[680px] lg:px-8 lg:py-28">

          <div className="max-w-3xl">


            {/* Slide Label */}

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md sm:text-sm">

              <span className="h-2 w-2 rounded-full bg-orange-500" />

              {slide.eyebrow}

            </div>


            {/* Slide Heading */}

            <h1
              key={`heading-${slide.id}`}
              className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {slide.title}

              <span className="mt-2 block text-orange-500">
                {slide.highlight}
              </span>
            </h1>


            {/* Description */}

            <p className="mt-7 max-w-2xl text-base leading-8 text-gray-200 sm:text-lg">
              {slide.description}
            </p>


            {/* SLIDE ACTIONS */}

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              {slide.primaryLink.startsWith(
                "#"
              ) ? (

                <a
                  href={
                    slide.primaryLink
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:bg-orange-500"
                >
                  {
                    slide.primaryText
                  }

                  <span className="ml-2">
                    →
                  </span>
                </a>

              ) : (

                <Link
                  to={
                    slide.primaryLink
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:bg-orange-500"
                >
                  {
                    slide.primaryText
                  }

                  <span className="ml-2">
                    →
                  </span>
                </Link>

              )}


              {!loading &&
              isAuthenticated ? (

                dashboardPath && (

                  <Link
                    to={
                      dashboardPath
                    }
                    className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                  >
                    Go to Dashboard
                  </Link>

                )

              ) : (

                <Link
                  to={
                    slide.secondaryLink
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  {
                    slide.secondaryText
                  }
                </Link>

              )}

            </div>


            {/* DISCOVERY BENEFITS */}

            <div className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">

              {[
                "Discover equipment",
                "Explore photographers",
                "Login required to rent or book",
              ].map(
                (item) => (

                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-gray-200 backdrop-blur-sm"
                  >

                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                      ✓
                    </span>

                    {item}

                  </div>

                )
              )}

            </div>

          </div>

        </div>


        {/* LEFT ARROW */}

        <button
          type="button"
          onClick={
            previousSlide
          }
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-orange-600 sm:flex lg:left-6"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>


        {/* RIGHT ARROW */}

        <button
          type="button"
          onClick={
            nextSlide
          }
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-orange-600 sm:flex lg:right-6"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>


        {/* SLIDER DOTS */}

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">

          {heroSlides.map(
            (
              item,
              index
            ) => (

              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setCurrentSlide(
                    index
                  )
                }
                aria-label={`Go to slide ${
                  index + 1
                }`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide ===
                  index
                    ? "w-8 bg-orange-500"
                    : "w-2.5 bg-white/50 hover:bg-white"
                }`}
              />

            )
          )}

        </div>


        {/* SLIDE NUMBER */}

        <div className="absolute bottom-6 right-6 z-20 hidden text-xs font-semibold tracking-widest text-white/60 sm:block">

          {String(
            currentSlide + 1
          ).padStart(
            2,
            "0"
          )}

          <span className="mx-2 text-white/30">
            /
          </span>

          {String(
            heroSlides.length
          ).padStart(
            2,
            "0"
          )}

        </div>

      </section>


      {/* ==========================================
          DISCOVERY INFORMATION STRIP
      ========================================== */}

      <section className="border-b border-gray-200 bg-white">

        <div className="mx-auto grid max-w-7xl divide-y divide-gray-200 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">

          {[
            [
              "01",
              "Discover",
              "Explore the equipment and photography services available.",
            ],

            [
              "02",
              "Register",
              "Create a customer account when you are ready to continue.",
            ],

            [
              "03",
              "Rent or Book",
              "Login to submit equipment rental or photographer booking requests.",
            ],
          ].map(
            ([
              number,
              title,
              text,
            ]) => (

              <div
                key={
                  number
                }
                className="flex gap-4 py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0"
              >

                <span className="text-sm font-black text-orange-600">
                  {number}
                </span>

                <div>

                  <p className="font-bold text-gray-950">
                    {title}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {text}
                  </p>

                </div>

              </div>

            )
          )}

        </div>

      </section>


      {/* ==========================================
          DISCOVER SERVICES
      ========================================== */}

      <section
        id="discover"
        className="bg-[#f7f7f5] py-20 sm:py-24"
      >

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div className="max-w-2xl">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">
                Discover our services
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                Everything you need
                for your next creative
                project.
              </h2>

            </div>


            <p className="max-w-lg text-sm leading-7 text-gray-600 sm:text-base">

              Browse the types of camera
              equipment available through
              the platform and discover
              photographers who can help
              bring your ideas to life.

            </p>

          </div>


          {/* Category Cards */}

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {categories.map(
              (
                category
              ) => (

                <article
                  key={
                    category.title
                  }
                  className="group relative min-h-80 overflow-hidden rounded-2xl bg-gray-900 shadow-sm"
                >

                  <img
                    src={
                      category.image
                    }
                    alt={
                      category.title
                    }
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />


                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">

                    <h3 className="text-xl font-bold">
                      {
                        category.title
                      }
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-200">
                      {
                        category.text
                      }
                    </p>

                    {category.link && (

                      <Link
                        to={
                          category.link
                        }
                        className="mt-4 inline-flex items-center text-sm font-semibold text-white transition hover:text-orange-300"
                      >
                        Explore Photographers

                        <span className="ml-2">
                          →
                        </span>
                      </Link>

                    )}

                  </div>

                </article>

              )
            )}

          </div>

        </div>

      </section>


      {/* ==========================================
          EQUIPMENT DISCOVERY
      ========================================== */}

      <section
        id="equipment"
        className="bg-white py-20 sm:py-24"
      >

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">


          {/* Equipment Images */}

          <div className="relative order-2 lg:order-1">

            <div className="grid grid-cols-2 gap-4">

              <img
                src={
                  cameraImage
                }
                alt="Camera equipment"
                loading="lazy"
                className="h-72 w-full rounded-2xl object-cover sm:h-96"
              />


              <div className="grid gap-4 pt-8">

                <img
                  src={
                    lensImage
                  }
                  alt="Professional camera lens"
                  loading="lazy"
                  className="h-36 w-full rounded-2xl object-cover sm:h-44"
                />


                <img
                  src={
                    equipmentImage
                  }
                  alt="Professional photography equipment"
                  loading="lazy"
                  className="h-36 w-full rounded-2xl object-cover sm:h-44"
                />

              </div>

            </div>


            <div className="absolute -bottom-5 left-5 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-xl">

              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Equipment discovery
              </p>

              <p className="mt-1 font-bold text-gray-950">
                Discover. Login.
                Rent.
              </p>

            </div>

          </div>


          {/* Equipment Description */}

          <div className="order-1 lg:order-2">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">
              Camera equipment
            </p>


            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
              Discover professional
              gear for your next
              shoot.
            </h2>


            <p className="mt-6 max-w-xl text-base leading-8 text-gray-600">

              Explore cameras, lenses,
              studio equipment and
              supporting photography gear
              available through Southern
              Camera Rental.

              <br />
              <br />

              When you find what you
              need, sign in to your
              customer account to check
              the rental workflow and
              submit your request.

            </p>


            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              {[
                [
                  "Camera Options",
                  "Discover camera equipment suitable for different types of photography.",
                ],

                [
                  "Lens Selection",
                  "Explore lenses for portraits, events, commercial work and creative shoots.",
                ],

                [
                  "Studio Equipment",
                  "Discover lighting and supporting equipment for studio photography.",
                ],

                [
                  "Customer Rental",
                  "Register or login when you are ready to submit an equipment rental request.",
                ],
              ].map(
                ([
                  title,
                  text,
                ]) => (

                  <div
                    key={
                      title
                    }
                    className="border-l-2 border-orange-500 pl-4"
                  >

                    <p className="font-bold text-gray-950">
                      {title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {text}
                    </p>

                  </div>

                )
              )}

            </div>


            {!isAuthenticated && (

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-6 py-3 font-semibold text-white transition hover:bg-black"
                >
                  Login to Rent
                </Link>


                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-800 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                >
                  Create Customer
                  Account
                </Link>

              </div>

            )}

          </div>

        </div>

      </section>


      {/* ==========================================
          PHOTOGRAPHER DISCOVERY
      ========================================== */}

      <section
        id="photographers"
        className="overflow-hidden bg-gray-950 py-20 text-white sm:py-24"
      >

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">


          {/* Photographer Text */}

          <div>

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-500">
              Photographer discovery
            </p>


            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Discover the right
              photographer for your
              moment.
            </h2>


            <p className="mt-6 max-w-xl leading-8 text-gray-300">

              Explore the photography
              services available through
              the platform and discover
              professional photographers
              for events, portraits,
              celebrations and creative
              projects.

              <br />
              <br />

              When you are ready to make
              a booking request, register
              or login to your customer
              account.

            </p>


            <div className="mt-8 flex flex-wrap gap-2">

              {[
                "Professional profiles",
                "Portfolio discovery",
                "Photography services",
                "Customer booking",
              ].map(
                (item) => (

                  <span
                    key={
                      item
                    }
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200"
                  >
                    {item}
                  </span>

                )
              )}

            </div>


            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <Link
                to="/photographers"
                className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-7 py-3.5 font-semibold text-white transition hover:bg-orange-500"
              >
                Explore Photographers

                <span className="ml-2">
                  →
                </span>
              </Link>


              {!isAuthenticated && (

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
                >
                  Login to Book
                </Link>

              )}

            </div>

          </div>


          {/* Photographer Images */}

          <div className="grid grid-cols-2 gap-4">

            <img
              src={
                photographer1Image
              }
              alt="Professional photographer"
              loading="lazy"
              className="h-[360px] w-full rounded-2xl object-cover sm:h-[460px]"
            />


            <div className="grid gap-4 pt-10">

              <img
                src={
                  photographer2Image
                }
                alt="Photographer preparing for a shoot"
                loading="lazy"
                className="h-[210px] w-full rounded-2xl object-cover"
              />


              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

                <p className="text-sm font-bold text-orange-400">
                  Discover creative
                  professionals
                </p>

                <p className="mt-2 text-xl font-bold">
                  Find a photographer
                  that matches your
                  needs.
                </p>

                <p className="mt-3 text-sm leading-6 text-gray-400">

                  Explore photography
                  services first, then
                  login to your account
                  when you are ready to
                  continue with a
                  booking.

                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ==========================================
          FEATURED PHOTOGRAPHERS
      ========================================== */}

      {(photographersLoading ||
        featuredPhotographers.length >
          0) && (

        <section className="bg-[#f7f7f5] py-20 sm:py-24">

          <div className="mx-auto max-w-7xl px-6 lg:px-8">


            {/* Heading */}

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

              <div className="max-w-2xl">

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">
                  Featured professionals
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  Meet some of our
                  photographers.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
                  Discover professionals
                  currently available
                  through Southern Camera
                  Rental and explore the
                  photographer that best
                  matches your needs.
                </p>

              </div>


              <Link
                to="/photographers"
                className="inline-flex w-fit items-center text-sm font-bold text-orange-600 transition hover:text-orange-700"
              >
                Discover All
                Photographers

                <span className="ml-2">
                  →
                </span>
              </Link>

            </div>


            {/* Loading Skeleton */}

            {photographersLoading ? (

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {[1, 2, 3].map(
                  (item) => (

                    <div
                      key={
                        item
                      }
                      className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >

                      <div className="h-64 bg-gray-200" />

                      <div className="p-5">

                        <div className="h-5 w-40 rounded bg-gray-200" />

                        <div className="mt-3 h-4 w-28 rounded bg-gray-100" />

                        <div className="mt-5 h-4 w-32 rounded bg-gray-100" />

                        <div className="mt-2 h-4 w-24 rounded bg-gray-100" />

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {featuredPhotographers.map(
                  (
                    photographer
                  ) => {

                    const name =
                      getPhotographerName(
                        photographer
                      );

                    const initials =
                      getPhotographerInitials(
                        photographer
                      );

                    const image =
                      getPhotographerImage(
                        photographer
                      );

                    const id =
                      getPhotographerId(
                        photographer
                      );

                    return (

                      <article
                        key={id}
                        className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
                      >


                        {/* Image */}

                        <div className="relative h-64 overflow-hidden bg-gray-100">

                          {image ? (

                            <img
                              src={
                                image
                              }
                              alt={
                                name
                              }
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />

                          ) : (

                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">

                              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-black text-orange-600 shadow-sm">
                                {
                                  initials
                                }
                              </div>

                            </div>

                          )}


                          <div className="absolute left-4 top-4 rounded-full bg-gray-950/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                            Featured
                          </div>

                        </div>


                        {/* Card Content */}

                        <div className="p-5 sm:p-6">

                          <h3 className="text-xl font-bold text-gray-950">
                            {name}
                          </h3>


                          <p className="mt-1 text-sm font-semibold text-orange-600">
                            {photographer.specialization ||
                              "Professional Photographer"}
                          </p>


                          <div className="mt-5 space-y-2 text-sm text-gray-600">

                            <div className="flex items-center justify-between gap-4">

                              <span className="text-gray-500">
                                Location
                              </span>

                              <span className="font-semibold text-gray-800">
                                {photographer.location ||
                                  "Not specified"}
                              </span>

                            </div>


                            <div className="flex items-center justify-between gap-4">

                              <span className="text-gray-500">
                                Starting rate
                              </span>

                              <span className="font-semibold text-gray-950">

                                {photographer.hourlyRate
                                  ? `LKR ${Number(
                                      photographer.hourlyRate
                                    ).toLocaleString()} / hr`
                                  : "Contact for rate"}

                              </span>

                            </div>

                          </div>


                          <Link
                            to={`/photographers/${id}`}
                            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                          >
                            View Profile

                            <span className="ml-2">
                              →
                            </span>
                          </Link>

                        </div>

                      </article>

                    );

                  }
                )}

              </div>

            )}


            {!photographersLoading &&
              featuredPhotographers.length >
                0 && (

                <div className="mt-10 text-center">

                  <Link
                    to="/photographers"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3.5 font-semibold text-gray-800 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                  >
                    Discover All
                    Photographers

                    <span className="ml-2">
                      →
                    </span>
                  </Link>

                </div>

              )}

          </div>

        </section>

      )}


      {/* ==========================================
          HOW IT WORKS
      ========================================== */}

      <section
        id="how-it-works"
        className="bg-white py-20 sm:py-24"
      >

        <div className="mx-auto max-w-7xl px-6 lg:px-8">


          {/* Heading */}

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">
              How it works
            </p>


            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Discover first. Login
              when you are ready.
            </h2>


            <p className="mt-4 leading-7 text-gray-600">

              Visitors can explore the
              services from the public
              website.

              <br />
              <br />

              A customer account is
              required before equipment
              rental or photographer
              booking requests can be
              submitted.

            </p>

          </div>


          {/* Steps */}

          <div className="mt-12 grid gap-5 md:grid-cols-4">

            {[
              [
                "1",
                "Discover",
                "Explore camera equipment and photography services from the public landing page.",
              ],

              [
                "2",
                "Register or Login",
                "Create a customer account or sign in to your existing account.",
              ],

              [
                "3",
                "Rent or Book",
                "Submit an equipment rental request or photographer booking request from your customer account.",
              ],

              [
                "4",
                "Manage",
                "Track your requests, status and upcoming activities from the customer dashboard.",
              ],
            ].map(
              ([
                number,
                title,
                text,
              ]) => (

                <article
                  key={
                    number
                  }
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-sm font-black text-orange-600">
                    {
                      number.padStart(
                        2,
                        "0"
                      )
                    }
                  </div>


                  <h3 className="mt-5 text-lg font-bold text-gray-950">
                    {title}
                  </h3>


                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {text}
                  </p>

                </article>

              )
            )}

          </div>

        </div>

      </section>


      {/* ==========================================
          REGISTER / LOGIN CTA
      ========================================== */}

      {!isAuthenticated && (

        <section className="bg-[#f7f7f5] px-6 py-20 sm:py-24">

          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-orange-600 px-7 py-14 text-white sm:px-12 lg:px-16">

            <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[42px] border-white/10" />


            <div className="relative max-w-2xl">

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-100">
                Ready to continue?
              </p>


              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Register or login to
                start renting and
                booking.
              </h2>


              <p className="mt-5 max-w-xl leading-7 text-orange-50">

                Discovery is open to
                everyone.

                <br />
                <br />

                A customer account is
                required when you want
                to rent equipment,
                request a photographer,
                manage requests or view
                your booking activity.

              </p>


              <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-7 py-3.5 font-semibold text-white transition hover:bg-black"
                >
                  Create Customer
                  Account

                  <span className="ml-2">
                    →
                  </span>
                </Link>


                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 font-semibold text-white transition hover:bg-white/15"
                >
                  Login
                </Link>

              </div>

            </div>

          </div>

        </section>

      )}


      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="bg-gray-950 text-gray-300">

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-8">


          {/* Brand */}

          <div className="max-w-md">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-xs font-black text-white">
                SCR
              </div>


              <div>

                <p className="font-bold text-white">
                  Southern Camera
                  Rent
                </p>

                <p className="text-xs text-gray-500">
                  Equipment &
                  Photographer Services
                </p>

              </div>

            </div>


            <p className="mt-5 text-sm leading-7 text-gray-400">

              Discover camera equipment
              and professional
              photographers through one
              platform.

              <br />
              <br />

              Register or login when you
              are ready to rent equipment
              or submit a photographer
              booking request.

            </p>

          </div>


          {/* Explore */}

          <div>

            <p className="text-sm font-bold uppercase tracking-wider text-white">
              Explore
            </p>


            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">

              <a
                href="#discover"
                className="transition hover:text-white"
              >
                Discover
              </a>

              <a
                href="#equipment"
                className="transition hover:text-white"
              >
                Equipment
              </a>

              <Link
                to="/photographers"
                className="transition hover:text-white"
              >
                Photographers
              </Link>

              <a
                href="#how-it-works"
                className="transition hover:text-white"
              >
                How It Works
              </a>

            </div>

          </div>


          {/* Account */}

          <div>

            <p className="text-sm font-bold uppercase tracking-wider text-white">
              Customer Account
            </p>


            <div className="mt-4 flex flex-col gap-3 text-sm text-gray-400">

              <Link
                to="/login"
                className="transition hover:text-white"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="transition hover:text-white"
              >
                Customer Registration
              </Link>

            </div>

          </div>

        </div>


        {/* Bottom Footer */}

        <div className="border-t border-white/10">

          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">

            <p>
              © 2026 Southern Camera
              Rental. All rights
              reserved.
            </p>

            <p>
              Camera Equipment Rental &
              Photographer Booking
              System
            </p>

          </div>

        </div>

      </footer>

    </main>
  );
};


export default Home;