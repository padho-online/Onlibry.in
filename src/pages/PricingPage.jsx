import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { loadRazorpayScript, openRazorpayModal } from "../services/razorpay";
import { logPaymentInitiation, logPaymentSuccess, logPaymentFailure, logPaymentModalClose } from '../services/paymentLogService';

function PricingPage() {
  const { user, isSubscribed, subscriptionType, updateSubscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);

  const plans = [
    {
      name: 'FREE',
      price: 0,
      period: 'lifetime',
      priceDisplay: '₹0',
      features: [
        'Access to free books and resources',
        'Selected PYQs',
        'Limited daily searches',
        'Ads enabled',
        'Online reading only'
      ],
      buttonText: 'Current Plan',
      buttonClass: 'bg-gray-500 cursor-default',
      popular: false
    },
    {
      name: 'PRO MONTHLY',
      price: 99,
      period: 'month',
      priceDisplay: '₹99',
      yearlyPrice: 99,
      durationDays: 30,
      features: [
        'Access to all premium files',
        'Unlimited online reading',
        'Unlimited downloads',
        'Ad-free experience',
        'Full video access',
        'Mock tests included',
        'Priority support'
      ],
      buttonText: 'Upgrade to Pro',
      buttonClass: 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600',
      popular: true
    },
    {
      name: 'PRO ANNUAL',
      price: 499,
      period: 'year',
      priceDisplay: '₹499',
      yearlyPrice: 499,
      monthlyEquivalent: 42,
      durationDays: 365,
      features: [
        'All Pro Monthly features',
        'Best value (Save ₹689/year)',
        'Premium badge',
        'Early access to new features',
        'Priority support + dedicated email'
      ],
      buttonText: 'Upgrade to Annual',
      buttonClass: 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600',
      popular: true
    }
  ];

  const handleSubscribe = async (planName, price, durationDays) => {
  if (!user) {
    navigate('/login', { state: { from: { pathname: '/pricing' } } });
    return;
  }

  if (price === 0) return;

  setProcessingPlan(planName);
  setLoading(true);

  // Log payment initiation
  await logPaymentInitiation(user.uid, user.email, planName, price);

  try {
    const scriptLoaded = await loadRazorpayScript();
    
    if (!scriptLoaded) {
      throw new Error('Failed to load payment gateway');
    }

    await openRazorpayModal({
      razorpay: window.Razorpay,
      amount: price,
      planName: planName,
      user: user,
      onSuccess: async (paymentData) => {
        // Log success
        await logPaymentSuccess(user.uid, user.email, planName, price, paymentData.paymentId, paymentData.orderId);
        
        const result = await updateSubscription(user.uid, planName.toLowerCase().replace('pro ', ''), durationDays);
        
        if (result.success) {
          alert(`Successfully subscribed to ${planName}! 🎉`);
          window.location.reload();
        } else {
          throw new Error(result.error);
        }
      },
      onFailure: async (error) => {
        await logPaymentFailure(user.uid, user.email, planName, price, error);
        alert('Payment cancelled or failed. Please try again.');
      },
      onModalClose: async () => {
        await logPaymentModalClose(user.uid, user.email, planName, price);
      }
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    await logPaymentFailure(user.uid, user.email, planName, price, error.message);
    alert('Something went wrong. Please try again later.');
  } finally {
    setLoading(false);
    setProcessingPlan(null);
  }
};

  return (
    <div className="py-12">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Processing {processingPlan} subscription...</p>
            <p className="text-sm text-gray-500 mt-2">Please don't close this window</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Get unlimited access to all premium educational resources, mock tests, and study materials
        </p>
      </div>

      {/* Current Subscription Badge */}
      {isSubscribed && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
          <p className="text-green-700 dark:text-green-400">
            🎉 You are currently on <strong>{subscriptionType?.toUpperCase()}</strong> plan!
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan, index) => {
          const isCurrentPlan = isSubscribed && subscriptionType?.toLowerCase() === plan.name.toLowerCase().replace('pro ', '');
          const isProcessing = processingPlan === plan.name;
          
          return (
            <div
              key={index}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-2 ${
                plan.popular ? 'ring-2 ring-green-500 shadow-xl' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                  POPULAR
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {plan.name}
                </h3>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-800 dark:text-white">
                    {plan.priceDisplay}
                  </span>
                  {plan.period !== 'lifetime' && (
                    <span className="text-gray-500 dark:text-gray-400"> /{plan.period}</span>
                  )}
                </div>
                
                {plan.monthlyEquivalent && (
                  <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                    Just ₹{plan.monthlyEquivalent}/month
                  </p>
                )}
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-green-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSubscribe(plan.name, plan.price, plan.durationDays)}
                  disabled={isCurrentPlan || plan.price === 0}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                    isCurrentPlan 
                      ? 'bg-gray-500 cursor-default' 
                      : isProcessing
                      ? 'bg-gray-400 cursor-wait'
                      : plan.buttonClass
                  }`}
                >
                  {isProcessing ? 'Processing...' : isCurrentPlan ? 'Current Plan' : plan.buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single File Purchase Section */}
      <div className="mt-16 max-w-4xl mx-auto px-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Need Just One File?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Purchase individual premium files starting from ₹9 to ₹49
          </p>
          <button
            onClick={() => navigate('/files')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Browse Files
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              What happens after my subscription ends?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              You will lose access to premium files but can still access all free resources. Your saved files and progress will be preserved.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Yes! You can cancel your subscription anytime from your account dashboard. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              What payment methods are accepted?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We accept all major credit/debit cards, UPI, NetBanking, and wallets through Razorpay.
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              Is there a refund policy?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We offer a 7-day money-back guarantee if you're not satisfied with our premium service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;