"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

 function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");

  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reference) {
      fetchPaymentDetails();
    }
  }, [reference]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payment-page/status?reference=${reference}`);
      const data = await response.json();
      if (data.success) {
        setPaymentDetails(data.payment);
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
    } finally {
      setLoading(false);
    }
  };

  const isSuccess = status === "success";
  const isFailed = status === "failed" || status === "error";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {isSuccess ? (
          <>
            <div className="bg-green-50 px-6 py-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Payment Successful!
              </h2>
              <p className="mt-2 text-gray-600">
                Your payment has been processed successfully.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <dl className="divide-y divide-gray-200">
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Reference</dt>
                  <dd className="text-sm text-gray-900">{reference}</dd>
                </div>
                {paymentDetails && (
                  <>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Amount</dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        ₦{paymentDetails.amount?.toLocaleString()}
                      </dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Customer</dt>
                      <dd className="text-sm text-gray-900">
                        {paymentDetails.customer_name}
                      </dd>
                    </div>
                    <div className="py-3 flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">
                        {paymentDetails.customer_email}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          </>
        ) : isFailed ? (
          <>
            <div className="bg-red-50 px-6 py-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Payment Failed
              </h2>
              <p className="mt-2 text-gray-600">
                {reason || "Your payment could not be processed. Please try again."}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-yellow-50 px-6 py-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Processing Payment
              </h2>
              <p className="mt-2 text-gray-600">
                Your payment is being processed. You will receive a confirmation email shortly.
              </p>
            </div>
          </>
        )}

        <div className="px-6 py-4 bg-gray-50 text-center">
          <Link
            href="/"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}


export default function paymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2b825b]"></div>
      </div>
    }>
      <PaymentStatusPage />
    </Suspense>
  );
}