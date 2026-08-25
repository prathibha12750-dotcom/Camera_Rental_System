import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-2xl font-bold text-orange-600">
          403
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-orange-600">
          Access restricted
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950">Access denied</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-gray-600">
          Your account is authenticated, but you do not have permission to access this page.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
};

export default Unauthorized;
