"use client";

import Link from "next/link";

interface MyAccountDetailsProps {
  loading2: boolean;
  userDetails: any;
  error?: string;
}

export default function MyAccountDetails({ loading2, userDetails, error }: MyAccountDetailsProps) {
  if (loading2) {
    return (
      <div className="bg-(--bg-secondary) p-3 rounded-lg border border-(--border-color) text-sm text-(--text-secondary) animate-pulse">
        Loading your bank details...
      </div>
    );
  }

  if (userDetails?.payment_details?.p_account_number && userDetails?.payment_details?.p_account_name) {
    return (
      <div className="bg-(--bg-secondary) p-3 rounded-lg border border-(--border-color) space-y-1 text-sm">
        <p className="text-(--text-primary)">
          <strong>Bank:</strong> {userDetails.payment_details.p_bank_name}
        </p>
        <p className="text-(--text-primary)">
          <strong>Account Number:</strong> {userDetails.payment_details.p_account_number}
        </p>
        <p className="text-(--text-primary)">
          <strong>Account Name:</strong> {userDetails.payment_details.p_account_name}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-red-50 p-3 rounded-lg border text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800">
      You have not set your bank account details yet.{" "}
      <Link href="/dashboard/profile" className="text-blue-500 hover:underline">
        Click here
      </Link>{" "}
      to add them.
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}