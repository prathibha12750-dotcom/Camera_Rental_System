import React, { useState } from 'react'

const Users = () => {
    const [showCreatePhotographer, setShowCreatePhotographer] = useState("false");
  return (
    <main>
        <div>

            {/* Page Header */}
            <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
                <div>
                    <p className='text-sm font-semibold uppercase tracking-wider text-orange-600'>
                        User Management
                    </p>
                    <h1 className='mt-2 text-3xl font-bold text-gray-950'>
                        Users
                    </h1>
                    <p className='mt-2 text-gray-600'>
                        Manage customers, photographers and staff accounts.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowCreatePhotographer(true)}
                    className='rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700'
                >
                    + Create Photographer
                </button>
            </div>

            {/* User Categories */}
            <div className='mt-8 grid gap-5 md:grid-cols-3'>

                {/* Customers */}
                <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600'>
                        C
                    </div>
                    <h2 className='mt-5 text-lg font-semibold text-gray-950'>
                        Customers
                    </h2>
                    <p className='mt-2 text-sm leading-6 text-gray-600'>
                        View and manage customer accounts
                    </p>
                    <div className='mt-5 rounded-xl bg-gray-50 px-4 py-3'>
                        <p className='text-sm text-gray-500'>
                            Customer Management
                        </p>
                        <p className='mt-1 text-sm font-semibold text-gray-700'>
                            Coming soon
                        </p>
                    </div>
                </div>

                {/* Photographers */}
                <div className='bg-white rounded-2xl border border-gray-200 p-6 shadow-sm'>
                    <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600'>
                        P
                    </div>
                    <h2 className='mt-5 text-lg font-semibold text-gray-950'>
                        Photographers
                    </h2>
                    <p className='mt-2 text-sm leading-6 text-gray-600'>
                        Create and manage photographer accounts.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowCreatePhotographer(true)}
                        className='mt-5 w-full rounded-xl border border-orange-200 px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50'
                    >
                        Create Photographer
                    </button>
                </div>

                {/* Staff/Admin */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                     <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-bold text-orange-600">
                        A
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-gray-950">
                        Staff / Admin
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        Manage staff and administrator accounts
                    </p>
                    <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3">
                        <p className="text-sm text-gray-500">
                            Staff Management
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-700">
                            Coming soon
                        </p>
                    </div>
                </div>

                {/* Create Photographer Placeholder */}
                {showCreatePhotographer && (
                    <div className='mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <h2 className='text-xl font-semibold text-gray-950'>Create Photographer</h2>
                                <p className='mt-1 text-sm text-gray-500'>Photographer account creation form will be added next</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreatePhotographer(false)}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </main>
  )
}

export default Users