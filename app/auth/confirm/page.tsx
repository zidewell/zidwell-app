// app/auth/confirm/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from URL parameters
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');

      console.log('Verification page loaded with params:', { accessToken, refreshToken, type });

      if (!accessToken) {
        setStatus('error');
        setMessage('No verification token found. Please check your email link.');
        return;
      }

      try {
        // Call your verification API
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            refreshToken,
            type: type || 'signup',
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus('success');
          setUserEmail(result.user?.email || '');
          setUserName(result.user?.full_name || '');
          setMessage(result.message || 'Email verified successfully!');
          
          // Clean URL (remove sensitive params)
          window.history.replaceState({}, '', '/auth/confirm');
        } else if (result.alreadyVerified) {
          setStatus('already_verified');
          setUserEmail(result.user?.email || '');
          setMessage('This email has already been verified.');
        } else {
          setStatus('error');
          setMessage(result.message || 'Invalid or expired verification link.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Unable to verify email. Please try again or request a new verification link.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleResendVerification = async () => {
    let emailToUse = userEmail;
    
    // Try to get email from token if not set
    if (!emailToUse) {
      const accessToken = searchParams.get('access_token');
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          emailToUse = payload.email || '';
          setUserEmail(emailToUse);
        } catch (e) {
          setMessage('Unable to resend verification. Please contact support.');
          return;
        }
      } else {
        setMessage('Unable to resend verification. Email not found.');
        return;
      }
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToUse,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResendSuccess(true);
        setMessage('Verification email has been resent. Please check your inbox.');
      } else {
        setMessage(result.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('Unable to resend verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Your Email</h2>
          <p className="text-gray-600">Please wait while we confirm your account...</p>
        </div>
      </div>
    );
  }

  // Success State
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Email Verified! ✅</h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">{message}</p>
            </div>
            
            {userName && (
              <p className="text-gray-600 mb-2">
                Welcome, <span className="font-semibold">{userName}</span>!
              </p>
            )}
            {userEmail && (
              <p className="text-gray-500 text-sm mb-6">
                {userEmail}
              </p>
            )}
            
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Go to Dashboard
            </Link>
            
            <p className="text-sm text-gray-500 mt-4">
              You can now access all features of your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Already Verified State
  if (status === 'already_verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Already Verified ℹ️</h1>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800">{message}</p>
            </div>
            
            {userEmail && (
              <p className="text-gray-500 text-sm mb-6">
                {userEmail}
              </p>
            )}
            
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Login Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Verification Failed ❌</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{message}</p>
          </div>
          
          {!resendSuccess ? (
            <>
              <p className="text-gray-600 mb-6">
                Don't worry! You can request a new verification email.
              </p>
              
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="inline-flex items-center justify-center w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-black font-bold py-3 px-6 rounded-lg transition duration-200 mb-3"
              >
                {isResending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
              
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Back to Login
              </Link>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800">{message}</p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Return to Login
              </Link>
            </>
          )}
          
          <p className="text-sm text-gray-500 mt-4">
            Need help? <Link href="/support" className="text-yellow-600 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <VerificationContent />
    </Suspense>
  );
}