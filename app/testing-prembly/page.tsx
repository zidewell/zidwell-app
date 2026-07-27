// app/page.js
'use client';

import { useState } from 'react';
import useIdentityPayKYC from 'next-identity-kyc';
import { 
  User, 
  Building2, 
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  // State for manual API verification (BVN, NIN, CAC)
  const [bvnNumber, setBvnNumber] = useState('');
  const [ninNumber, setNinNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  
  // State for KYC widget user details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  const [results, setResults] = useState({
    bvn: { loading: false, data: null, error: null },
    nin: { loading: false, data: null, error: null },
    cac: { loading: false, data: null, error: null },
    kyc: { loading: false, data: null, error: null }, 
  });

  // KYC Widget Configuration - Using next-identity-kyc format
  const kycConfig: any = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    merchant_key: "",
    user_ref: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    is_test: process.env.NODE_ENV !== 'production',
    config_id: "", // optional
    callback: (response) => {
      console.log('KYC Response:', response);
      
      // Handle different response types
      if (response.status === 'success' && response.code === '00') {
        // Successful verification
        setResults(prev => ({
          ...prev,
          kyc: {
            loading: false,
            data: {
              success: true,
              status: response.status,
              message: response.message,
              channel: response.channel,
              data: response.data
            },
            error: null
          }
        }));
      } else if (response.status === 'failed' && response.code === 'E01') {
        // Failed verification
        setResults(prev => ({
          ...prev,
          kyc: {
            loading: false,
            data: null,
            error: `${response.code}: ${response.message}`
          }
        }));
      } else if (response.code === 'E02' && response.status === 'failed') {
        // User cancelled
        setResults(prev => ({
          ...prev,
          kyc: {
            loading: false,
            data: null,
            error: 'Verification was cancelled by user'
          }
        }));
      } else {
        // Handle other responses
        setResults(prev => ({
          ...prev,
          kyc: {
            loading: false,
            data: null,
            error: response.message || 'Unknown response received'
          }
        }));
      }
    },
  };

  const verifyWithIdentity = useIdentityPayKYC(kycConfig);

  // Manual API verification functions
  const verifyAPI = async (type, payload) => {
    setResults(prev => ({
      ...prev,
      [type]: { loading: true, data: null, error: null }
    }));

    const startTime = Date.now();

    try {
      const response = await fetch(`/api/users-verification/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      setResults(prev => ({
        ...prev,
        [type]: {
          loading: false,
          data: data,
          error: data.success ? null : data.message || 'Verification failed',
          responseTime
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [type]: {
          loading: false,
          data: null,
          error: error.message || 'Network error',
          responseTime: Date.now() - startTime
        }
      }));
    }
  };

  const getStatusIcon = (result) => {
    if (result.loading) return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    if (result.error) return <XCircle className="w-4 h-4 text-red-500" />;
    if (result.data?.success) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = (result) => {
    if (result.loading) return 'Verifying...';
    if (result.error) return 'Failed';
    if (result.data?.success) return 'Success';
    return 'Ready';
  };

  const getStatusColor = (result) => {
    if (result.loading) return 'text-blue-500';
    if (result.error) return 'text-red-500';
    if (result.data?.success) return 'text-green-500';
    return 'text-gray-400';
  };

  const renderResult = (result) => {
    if (result.loading) {
      return (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      );
    }

    if (result.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm whitespace-pre-wrap">{result.error}</p>
        </div>
      );
    }

    if (result.data) {
      const formattedData = result.data.data || result.data;
      
      return (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-600 text-sm font-medium">✓ Success</span>
            {result.responseTime && (
              <span className="text-xs text-gray-500">{result.responseTime}ms</span>
            )}
          </div>
          <div className="bg-gray-50 p-3 rounded-lg overflow-auto max-h-80">
            <pre className="text-xs whitespace-pre-wrap break-all">
              {JSON.stringify(formattedData, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    return (
      <p className="text-gray-400 text-sm italic">Enter details and click verify</p>
    );
  };

  const VerificationCard = ({ 
    type, 
    title, 
    icon: Icon, 
    children 
  }) => {
    const result = results[type];

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-blue-600" />
              <h2 className="font-medium text-gray-800">{title}</h2>
            </div>
            <div className="flex items-center gap-1">
              {getStatusIcon(result)}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {children}
            <div className="pt-3 border-t border-gray-100">
              {renderResult(result)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const clearAll = () => {
    setResults({
      bvn: { loading: false, data: null, error: null },
      nin: { loading: false, data: null, error: null },
      cac: { loading: false, data: null, error: null },
      kyc: { loading: false, data: null, error: null },
    });
  };

  const fillTestData = () => {
    setBvnNumber('54651333604');
    setNinNumber('56182742701');
    setRcNumber('092932');
    setFirstName('John');
    setLastName('Doe');
    setEmail('john.doe@example.com');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Prembly Verification</h1>
            <p className="text-sm text-gray-600">Test BVN, NIN, CAC, and KYC Widget</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fillTestData}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded transition-colors"
            >
              Fill Test Data
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* KYC Widget */}
          <div className="md:col-span-2">
            <VerificationCard type="kyc" title="KYC Widget (IdentityPass)" icon={User}>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Enter user details below. These will be used when launching the KYC widget.
                  </p>
                </div>
                
                {/* User Details Inputs for KYC Widget */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                
                {/* Display config status */}
                <div className="flex gap-4 text-xs">
                  <div className={process.env.NEXT_PUBLIC_MERCHANT_KEY ? 'text-green-600' : 'text-yellow-600'}>
                    {process.env.NEXT_PUBLIC_MERCHANT_KEY ? '✓ Merchant Key configured' : '⚠ Merchant Key not set'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {process.env.NEXT_PUBLIC_CONFIG_ID ? '✓ Config ID set' : 'Config ID optional'}
                  </div>
                </div>
                
                <button
                  onClick={verifyWithIdentity}
                  disabled={results.kyc.loading || !firstName || !lastName || !email}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium py-2 rounded transition-colors"
                >
                  {results.kyc.loading ? 'Opening Widget...' : 'Launch KYC Widget'}
                </button>
              </div>
            </VerificationCard>
          </div>

          {/* BVN */}
          <VerificationCard type="bvn" title="BVN Verification" icon={User}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BVN Number
              </label>
              <input
                type="text"
                value={bvnNumber}
                onChange={(e) => setBvnNumber(e.target.value)}
                placeholder="Enter BVN number"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    verifyAPI('bvn', { number: bvnNumber });
                  }
                }}
              />
            </div>
            <button
              onClick={() => verifyAPI('bvn', { number: bvnNumber })}
              disabled={!bvnNumber || results.bvn.loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2 rounded transition-colors"
            >
              {results.bvn.loading ? 'Verifying...' : 'Verify BVN'}
            </button>
          </VerificationCard>

          {/* NIN */}
          <VerificationCard type="nin" title="NIN Verification" icon={User}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIN Number
              </label>
              <input
                type="text"
                value={ninNumber}
                onChange={(e) => setNinNumber(e.target.value)}
                placeholder="Enter NIN number"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    verifyAPI('nin', { number: ninNumber });
                  }
                }}
              />
            </div>
            <button
              onClick={() => verifyAPI('nin', { number: ninNumber })}
              disabled={!ninNumber || results.nin.loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium py-2 rounded transition-colors"
            >
              {results.nin.loading ? 'Verifying...' : 'Verify NIN'}
            </button>
          </VerificationCard>

          {/* CAC */}
          <VerificationCard type="cac" title="CAC Verification" icon={Building2}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RC Number
              </label>
              <input
                type="text"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                placeholder="Enter RC number"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    verifyAPI('cac', { 
                      rc_number: rcNumber,
                      company_type: 'RC'
                    });
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Company type defaults to RC (Registered Company)
              </p>
            </div>
            <button
              onClick={() => verifyAPI('cac', { 
                rc_number: rcNumber,
                company_type: 'RC'
              })}
              disabled={!rcNumber || results.cac.loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium py-2 rounded transition-colors"
            >
              {results.cac.loading ? 'Verifying...' : 'Verify CAC'}
            </button>
          </VerificationCard>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 text-sm">Test Data & Information</p>
              <ul className="text-xs text-blue-700 space-y-1 mt-1">
                <li>• <strong>BVN:</strong> 54651333604</li>
                <li>• <strong>NIN:</strong> 56182742701</li>
                <li>• <strong>CAC RC:</strong> 092932 (Company Type: RC)</li>
                <li>• <strong>KYC Widget:</strong> Uses first name, last name, and email</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2">
                💡 Press Enter in any input field to trigger verification
              </p>
            </div>
          </div>
        </div>

        {/* Response Legend */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Response Codes:</strong><br />
            • <span className="text-green-600">00</span> - Successful<br />
            • <span className="text-red-600">01</span> - ID not found<br />
            • <span className="text-yellow-600">02</span> - Service not available<br />
            • <span className="text-orange-600">03</span> - Insufficient wallet balance<br />
            • <span className="text-red-600">E01</span> - Verification failed<br />
            • <span className="text-red-600">E02</span> - Verification cancelled
          </p>
        </div>
      </div>
    </div>
  );
}