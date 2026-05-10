// src/pages/PricingPage.jsx
// COMPLETE FIXED - Razorpay Payment Working

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadRazorpayScript, createRazorpayOrder } from "../services/razorpay";
import { logPaymentInitiation, logPaymentSuccess, logPaymentFailure, logPaymentModalClose } from '../services/paymentLogService';
import { logPayment } from '../services/loggerService';

function PricingPage() {
  const { user, isSubscribed, subscriptionType, updateSubscription } = useAuth();
  const { cartItems, cartTotal, removeFromCart, clearCart, getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('subscription');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script on mount
  useEffect(() => {
    const loadScript = async () => {
      const loaded = await loadRazorpayScript();
      setRazorpayLoaded(loaded);
      if (!loaded) {
        console.error('❌ Razorpay script failed to load');
      } else {
        console.log('✅ Razorpay script loaded');
      }
    };
    loadScript();
  }, []);

  // Check location state for activeTab
  useEffect(() => {
    if (location.state?.activeTab === 'cart') {
      setActiveTab('cart');
    } else if (location.state?.activeTab === 'subscription') {
      setActiveTab('subscription');
    }
  }, [location]);

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

  // Handle subscription purchase
  const handleSubscribe = async (planName, price, durationDays) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    if (price === 0) return;

    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please try again in a moment.');
      return;
    }

    setProcessingPlan(planName);
    setLoading(true);

    await logPaymentInitiation(user.uid, user.email, planName, price);

    try {
      console.log('📡 Creating order for plan:', planName, 'Amount:', price);
      
      const order = await createRazorpayOrder(price);
      
      if (!order || !order.id) {
        throw new Error('Failed to create order');
      }
      
      console.log('✅ Order created:', order.id);
      
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `${planName} Subscription`,
        image: 'https://onlibry.in/logo transparent.png',
        order_id: order.id,
        handler: async (response) => {
          console.log('✅ Payment success:', response);
          
          await logPayment('payment_success', planName, price, 'success', response.razorpay_payment_id, response.razorpay_order_id);
          await logPaymentSuccess(user.uid, user.email, planName, price, response.razorpay_payment_id, response.razorpay_order_id);
          
          const result = await updateSubscription(user.uid, planName.toLowerCase().replace('pro ', ''), durationDays);
          
          if (result.success) {
            alert(`Successfully subscribed to ${planName}! 🎉`);
            window.location.reload();
          } else {
            throw new Error(result.error);
          }
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#22c55e',
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
            logPaymentModalClose(user.uid, user.email, planName, price);
            setLoading(false);
            setProcessingPlan(null);
          }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      await logPayment('payment_failed', planName, price, 'failed', null, null, error.message);
      await logPaymentFailure(user.uid, user.email, planName, price, error.message);
      alert(error.message || 'Something went wrong. Please try again later.');
      setLoading(false);
      setProcessingPlan(null);
    }
  };

  // Handle cart checkout (bulk file purchase)
  const handleCartCheckout = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please try again in a moment.');
      return;
    }

    setLoading(true);

    try {
      const totalAmount = cartTotal;
      console.log('📡 Creating order for cart total:', totalAmount);
      
      const order = await createRazorpayOrder(totalAmount);
      
      if (!order || !order.id) {
        throw new Error('Failed to create order');
      }
      
      console.log('✅ Order created:', order.id);
      
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `Purchase ${cartItems.length} item(s)`,
        image: 'https://onlibry.in/logo transparent.png',
        order_id: order.id,
        handler: async (response) => {
          console.log('✅ Cart payment success:', response);
          
          await logPayment('cart_payment_success', 'Cart Purchase', totalAmount, 'success', response.razorpay_payment_id, response.razorpay_order_id);
          
          alert(`Successfully purchased ${cartItems.length} item(s)! 🎉`);
          clearCart();
          navigate('/files');
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#22c55e',
        },
        modal: {
          ondismiss: () => {
            console.log('Cart checkout cancelled');
            setLoading(false);
          }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Cart checkout error:', error);
      alert(error.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle single file checkout from cart
  const handleSingleFileCheckout = async (item) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please try again in a moment.');
      return;
    }

    setLoading(true);

    try {
      console.log('📡 Creating order for file:', item.name, 'Amount:', item.price);
      
      const order = await createRazorpayOrder(item.price);
      
      if (!order || !order.id) {
        throw new Error('Failed to create order');
      }
      
      console.log('✅ Order created:', order.id);
      
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `Purchase: ${item.name}`,
        image: 'https://onlibry.in/logo transparent.png',
        order_id: order.id,
        handler: async (response) => {
          console.log('✅ Single file payment success:', response);
          
          await logPayment('single_file_payment_success', item.name, item.price, 'success', response.razorpay_payment_id, response.razorpay_order_id);
          alert(`Successfully purchased "${item.name}"! 🎉`);
          removeFromCart(item.id);
          setLoading(false);
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#22c55e',
        },
        modal: {
          ondismiss: () => {
            console.log('Single file checkout cancelled');
            setLoading(false);
          }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Single file checkout error:', error);
      alert(error.message || 'Something went wrong. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <div className="py-12">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Processing {processingPlan || 'order'}...</p>
            <p className="text-sm text-gray-500 mt-2">Please don't close this window</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Pricing & Cart
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose a subscription plan or purchase individual files
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'subscription'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            📦 Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'cart'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            🛒 My Cart ({getCartCount()})
          </button>
        </div>
      </div>

      {/* Current Subscription Badge */}
      {isSubscribed && activeTab === 'subscription' && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
          <p className="text-green-700 dark:text-green-400">
            🎉 You are currently on <strong>{subscriptionType?.toUpperCase()}</strong> plan!
          </p>
        </div>
      )}

      {/* Razorpay Loading Warning */}
      {!razorpayLoaded && activeTab === 'subscription' && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-center">
          <p className="text-yellow-700 dark:text-yellow-400">
            ⏳ Loading payment gateway...
          </p>
        </div>
      )}

      {/* Subscription Plans Tab */}
      {activeTab === 'subscription' && (
        <>
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
                      disabled={isCurrentPlan || plan.price === 0 || !razorpayLoaded}
                      className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                        isCurrentPlan 
                          ? 'bg-gray-500 cursor-default' 
                          : isProcessing
                          ? 'bg-gray-400 cursor-wait'
                          : !razorpayLoaded
                          ? 'bg-gray-400 cursor-wait'
                          : plan.buttonClass
                      }`}
                    >
                      {isProcessing ? 'Processing...' : !razorpayLoaded ? 'Loading...' : isCurrentPlan ? 'Current Plan' : plan.buttonText}
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
                Add files to cart and purchase them together
              </p>
              <button
                onClick={() => setActiveTab('cart')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                View Cart ({getCartCount()})
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cart Tab */}
      {activeTab === 'cart' && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <h2 className="text-2xl font-bold">Your Cart</h2>
              <p className="opacity-90 mt-1">Review and purchase your selected files</p>
            </div>
            
            {cartItems.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Cart is Empty</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Add files from the Files page to purchase them
                </p>
                <button
                  onClick={() => navigate('/files')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.type === 'file' ? '📄 File' : item.type === 'mocktest' ? '📝 Mock Test' : '❓ Quiz'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 dark:text-green-400">
                          ₹{item.price}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleSingleFileCheckout(item)}
                            disabled={!razorpayLoaded}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            Buy Now
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Cart Summary */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">Total:</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{cartTotal}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={clearCart}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Clear Cart
                    </button>
                    <button
                      onClick={handleCartCheckout}
                      disabled={!razorpayLoaded}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                    >
                      Checkout (₹{cartTotal})
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Secure payment via Razorpay
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FAQ Section - Only show on subscription tab */}
      {activeTab === 'subscription' && (
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
          </div>
        </div>
      )}
    </div>
  );
}

export default PricingPage;