import { useEffect, useState } from "react";
import api from "../../services/api";

const CustomerBilling = () => {
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState("");

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadInvoices = async () => {
      try {
        const response = await api.get(
          "/customer/invoices"
        );

        if (!cancelled) {
          setInvoices(
            response.data?.data?.invoices || []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error.response?.data?.message ||
              "Failed to load your invoices."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingInvoices(false);
        }
      }
    };

    loadInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPayments = async () => {
        try {
        const response = await api.get(
            "/customer/payments"
        );

        if (!cancelled) {
            setPayments(
            response.data?.data?.payments || []
            );
        }
        } catch (error) {
        if (!cancelled) {
            setError(
            error.response?.data?.message ||
                "Failed to load your payment history."
            );
        }
        } finally {
        if (!cancelled) {
            setLoadingPayments(false);
        }
        }
    };

    loadPayments();

    return () => {
        cancelled = true;
    };
    }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-950">
            Invoices & Payments
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            View your invoices, payment status, and payment history.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-950">
            My Invoices
          </h2>

          {loadingInvoices ? (
            <p className="mt-4 text-sm text-gray-500">
              Loading invoices...
            </p>
          ) : invoices.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
              <p className="text-sm font-medium text-gray-700">
                No invoices found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Your invoices will appear here when they are available.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Invoice
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Service
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Service Amount
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Deposit
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice._id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {invoice.serviceDetails}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        LKR{" "}
                        {Number(
                          invoice.serviceAmount || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        LKR{" "}
                        {Number(
                          invoice.securityDeposit || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        LKR{" "}
                        {Number(
                          invoice.totalAmount || 0
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {invoice.paymentStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-950">
            Payment History
        </h2>

        <p className="mt-1 text-sm text-gray-500">
            View payments recorded against your invoices.
        </p>

        {loadingPayments ? (
            <p className="mt-4 text-sm text-gray-500">
            Loading payment history...
            </p>
        ) : payments.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">
                No payments found
            </p>

            <p className="mt-1 text-sm text-gray-500">
                Your payment records will appear here when payments are recorded.
            </p>
            </div>
        ) : (
            <div className="mt-6 overflow-x-auto">
            <table className="min-w-full">
                <thead>
                <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Invoice
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Service
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Method
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                    </th>
                </tr>
                </thead>

                <tbody>
                {payments.map((payment) => (
                    <tr
                    key={payment._id}
                    className="border-b border-gray-100 last:border-0"
                    >
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {payment.invoice?.invoiceNumber || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                        {payment.invoice?.serviceDetails || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        LKR{" "}
                        {Number(
                        payment.amount || 0
                        ).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                        {payment.paymentMethod === "BANK_TRANSFER"
                        ? "Bank Transfer"
                        : payment.paymentMethod || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                        {payment.paymentStatus || "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                        {payment.createdAt
                        ? new Date(
                            payment.createdAt
                            ).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default CustomerBilling;