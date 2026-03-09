"use client";

import { useSubscription } from '@/app/hooks/useSubscripion'; 
import { Button2 } from '../ui/button2'; 
import { Check, AlertCircle, Calendar, CreditCard, Zap, Crown, Sparkles, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { SubscriptionBadge } from './subscriptionBadges'; 

export function SubscriptionDashboard() {
  const { 
    subscription, 
    loading, 
    cancelSubscription, 
    getUpgradeBenefits,
    userTier,
    isActive,
    checkTrialStatus
  } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [bookkeepingTrial, setBookkeepingTrial] = useState<any>(null);

  // Check for active trials
  useEffect(() => {
    if (subscription?.tier === 'free') {
      checkTrialStatus('bookkeeping_access').then(setBookkeepingTrial);
    }
  }, [subscription?.tier, checkTrialStatus]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C29307]"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">No subscription found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Get started by choosing a plan that fits your business.</p>
        <Button2 onClick={() => window.location.href = '/#pricing'}>
          View Plans
        </Button2>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      case 'expired':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelSubscription();
    if (result.success) {
      setShowCancelConfirm(false);
    }
    setCancelling(false);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return null;
      case 'growth': return <Zap className="w-5 h-5 text-blue-600" />;
      case 'premium': return <Crown className="w-5 h-5 text-[#C29307]" />;
      case 'elite': return <Sparkles className="w-5 h-5 text-purple-600" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-50">
        Subscription Management
      </h2>

      {/* Current Plan Card */}
      <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {getTierIcon(subscription.tier)}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 capitalize">
                {subscription.tier} Plan
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscription.status)}`}>
                {subscription.status}
              </span>
            </div>
            
            {subscription.expiresAt && subscription.tier !== 'free' && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <Calendar className="w-4 h-4" />
                <span>
                  {subscription.status === 'active' 
                    ? `Renews on ${formatDate(subscription.expiresAt)}`
                    : `Expired on ${formatDate(subscription.expiresAt)}`
                  }
                </span>
              </div>
            )}

            {subscription.tier === 'free' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You're on the free plan. Upgrade to access more features and higher limits.
                </p>
                
                {/* Show trial information if active */}
                {bookkeepingTrial?.isActive && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold">Bookkeeping Trial Active</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      You have {bookkeepingTrial.daysRemaining} days remaining in your free trial.
                      {bookkeepingTrial.daysRemaining <= 3 && (
                        <span className="block mt-1 font-medium">
                          ⚠️ Your trial ends soon! Upgrade to keep access.
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Monthly invoice limit:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">5</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Monthly receipt limit:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">5</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Monthly contract limit:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">1</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Bookkeeping:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-gray-50">
                      {bookkeepingTrial?.isActive ? 'Trial Active' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {subscription.tier !== 'free' && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Plan Benefits</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Invoices:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Receipts:</span> Unlimited
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Contracts:</span> {subscription.tier === 'growth' ? '5/month' : 'Unlimited'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Support:</span> {subscription.tier === 'growth' ? 'WhatsApp' : subscription.tier === 'premium' ? 'Priority' : 'Direct'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {subscription.tier !== 'free' && subscription.status === 'active' && (
            <div className="mt-4 md:mt-0 md:ml-6">
              {!showCancelConfirm ? (
                <Button2
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel Subscription
                </Button2>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 dark:text-red-400">Are you sure?</p>
                  <div className="flex gap-2">
                    <Button2
                      size="sm"
                      variant="outline"
                      className="border-gray-300"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      No
                    </Button2>
                    <Button2
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelling...' : 'Yes'}
                    </Button2>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Features List */}
      {subscription.tier !== 'free' && (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
            All Features Included
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(subscription.features || {}).map(([key, feature]: [string, any]) => (
              <div key={key} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#C29307] shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm text-gray-900 dark:text-gray-50">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                    {feature.value === 'true' ? 'Included' : 
                     feature.value === 'unlimited' ? 'Unlimited' :
                     feature.limit ? `${feature.limit} per month` : feature.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History - Placeholder for now */}
      {subscription.tier !== 'free' && (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
            Payment History
          </h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CreditCard className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No payment history available</p>
            <p className="text-sm mt-1">Your first payment will appear here</p>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      {subscription.tier !== 'elite' && (
        <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-50 shadow-[4px_4px_0px_#111827] dark:shadow-[4px_4px_0px_#fbbf24] p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-50">
            Upgrade Your Plan
          </h3>
          <div className="space-y-4">
            {['growth', 'premium', 'elite']
              .filter(tier => {
                const tiers = ['free', 'growth', 'premium', 'elite'];
                return tiers.indexOf(tier) > tiers.indexOf(subscription.tier);
              })
              .map(tier => (
                <div key={tier} className="border-2 border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:border-[#C29307] transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTierIcon(tier)}
                        <h4 className="font-bold text-gray-900 dark:text-gray-50 capitalize">
                          {tier} Plan
                        </h4>
                      </div>
                      <ul className="space-y-1 mb-4 md:mb-0">
                        {getUpgradeBenefits(tier).slice(0, 4).map((benefit, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Check className="w-3 h-3 text-[#C29307] shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                        {getUpgradeBenefits(tier).length > 4 && (
                          <li className="text-sm text-[#C29307] mt-1">
                            +{getUpgradeBenefits(tier).length - 4} more benefits
                          </li>
                        )}
                      </ul>
                    </div>
                    <Button2
                      onClick={() => window.location.href = '/#pricing'}
                      className="md:ml-4 mt-4 md:mt-0"
                    >
                      Upgrade to {tier}
                    </Button2>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}