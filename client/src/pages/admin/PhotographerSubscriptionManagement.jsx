
import { useState } from "react";

import PhotographerSubscriptions from "../clerk/PhotographerSubscriptions";
import SubscriptionPayments from "../clerk/SubscriptionPayments";

// ==========================================
// SUBSCRIPTION MANAGEMENT TABS
// ==========================================

const tabs = [
  {
    id: "subscriptions",
    label: "Subscriptions",
  },
  {
    id: "verification",
    label: "Payment Verification",
  },
  {
    id: "history",
    label: "Payment History",
  },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

const PhotographerSubscriptionManagement = ({
  initialTab = "subscriptions",
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="min-w-0 space-y-6 pb-6">
      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <div className="px-4 pt-6 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 sm:text-sm">
          Photographer Management
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Subscription Management
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Manage photographer subscriptions, verify
          payments, and review payment history in one
          place.
        </p>
      </div>

      {/* ======================================
          RESPONSIVE TAB NAVIGATION
      ====================================== */}

      <div className="min-w-0 px-4 sm:px-6">
        <div
          role="tablist"
          aria-label="Subscription management sections"
          className="grid grid-cols-1 gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:grid-cols-3"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`subscription-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`subscription-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-11 items-center justify-center rounded-xl px-3 py-3 text-center text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================
          TAB CONTENT
      ====================================== */}

      <div
        id={`subscription-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`subscription-tab-${activeTab}`}
        className="min-w-0"
      >
        {activeTab === "subscriptions" && (
          <PhotographerSubscriptions embedded />
        )}

        {activeTab === "verification" && (
          <SubscriptionPayments
            key="verification"
            initialStatusFilter="PENDING"
            embedded
          />
        )}

        {activeTab === "history" && (
          <SubscriptionPayments
            key="history"
            initialStatusFilter="APPROVED"
            embedded
          />
        )}
      </div>
    </div>
  );
};

export default PhotographerSubscriptionManagement;
