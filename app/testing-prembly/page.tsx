// app/page.js
'use client';

import { useState, useRef } from 'react';
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
  // Input refs
  const bvnInputRef = useRef(null);
  const ninInputRef = useRef(null);
  const rcInputRef = useRef(null);
  
  const [results, setResults] = useState({
    bvn: { loading: false, data: null, error: null },
    nin: { loading: false, data: null, error: null },
    cac: { loading: false, data: null, error: null },
  });

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
          <p className="text-red-600 text-sm">{result.error}</p>
        </div>
      );
    }

    if (result.data) {
      return (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-600 text-sm font-medium">✓ Success</span>
            <span className="text-xs text-gray-500">{result.responseTime}ms</span>
          </div>
          <pre className="bg-gray-50 p-3 rounded-lg overflow-auto max-h-60 text-xs">
            {JSON.stringify(result.data, null, 2)}
          </pre>
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
    });
  };

  const fillTestData = () => {
    if (bvnInputRef.current) bvnInputRef.current.value = '54651333604';
    if (ninInputRef.current) ninInputRef.current.value = '56182742701';
    if (rcInputRef.current) rcInputRef.current.value = '092932';
  };

  // Get values from refs
  const getBVN = () => bvnInputRef.current?.value || '';
  const getNIN = () => ninInputRef.current?.value || '';
  const getRC = () => rcInputRef.current?.value || '';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Prembly Verification</h1>
            <p className="text-sm text-gray-600">Test BVN, NIN, and CAC verification APIs</p>
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

        <div className="grid md:grid-cols-1 gap-4">
          {/* BVN */}
          <VerificationCard type="bvn" title="BVN Verification" icon={User}>
            <input
              ref={bvnInputRef}
              type="text"
              placeholder="Enter BVN number"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  verifyAPI('bvn', { number: getBVN() });
                }
              }}
            />
            <button
              onClick={() => verifyAPI('bvn', { number: getBVN() })}
              disabled={results.bvn.loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2 rounded transition-colors"
            >
              {results.bvn.loading ? 'Verifying...' : 'Verify BVN'}
            </button>
          </VerificationCard>

          {/* NIN */}
          <VerificationCard type="nin" title="NIN Verification" icon={User}>
            <input
              ref={ninInputRef}
              type="text"
              placeholder="Enter NIN number"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  verifyAPI('nin', { number: getNIN() });
                }
              }}
            />
            <button
              onClick={() => verifyAPI('nin', { number: getNIN() })}
              disabled={results.nin.loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium py-2 rounded transition-colors"
            >
              {results.nin.loading ? 'Verifying...' : 'Verify NIN'}
            </button>
          </VerificationCard>

          {/* CAC */}
          <VerificationCard type="cac" title="CAC Verification" icon={Building2}>
            <div className="space-y-2">
              <input
                ref={rcInputRef}
                type="text"
                placeholder="Enter RC number"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    verifyAPI('cac', { 
                      rc_number: getRC(),
                      company_type: 'RC'
                    });
                  }
                }}
              />
            </div>
            <button
              onClick={() => verifyAPI('cac', { 
                rc_number: getRC(),
                company_type: 'RC'
              })}
              disabled={results.cac.loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-medium py-2 rounded transition-colors"
            >
              {results.cac.loading ? 'Verifying...' : 'Verify CAC'}
            </button>
          </VerificationCard>
        </div>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 text-sm">Test Data</p>
              <ul className="text-xs text-blue-700 space-y-0.5 mt-1">
                <li>• BVN: 54651333604</li>
                <li>• NIN: 56182742701</li>
                <li>• CAC RC: 092932</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}