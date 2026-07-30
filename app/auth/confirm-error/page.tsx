// app/auth/confirm-error/page.jsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'An error occurred during email verification';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            {/* Custom X Circle Icon */}
            <svg 
              className="h-12 w-12 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M15 9l-6 6M9 9l6 6" 
              />
            </svg>
          </div>
        </div>
        
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verification Failed
          </h2>
          <p className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </p>
          <p className="mt-4 text-sm text-gray-600">
            The verification link may have expired or been used already.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/auth/register"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FDC020] hover:bg-[#e5ae1d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FDC020] transition-colors"
          >
            Create New Account
          </Link>
          
          <Link
            href="/auth/login"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FDC020] transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}