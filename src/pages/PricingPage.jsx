// src/pages/PricingPage.jsx - Mobile optimized
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadRazorpayScript, createRazorpayOrder } from "../services/razorpay";
import { CreditCard, ShoppingCart, Trash2, Zap, Check, Crown, Calendar, Lock } from 'lucide-react';

function PricingPage() {
  const { user, isSubscribed, subscriptionType, updateSubscription } = useAuth();
  const { cartItems, cartTotal, removeFromCart, clearCart, getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('subscription');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then(setRazorpayLoaded);
    if (location.state?.activeTab === 'cart') setActiveTab('cart');
  }, []);

  const plans = [
    { name: 'FREE', price: 0, period: 'lifetime', priceDisplay: '₹0', features: ['Access to free resources', 'Selected PYQs', 'Limited searches', 'Ads enabled'], buttonClass: 'bg-gray-500', popular: false },
    { name: 'PRO MONTHLY', price: 99, period: 'month', priceDisplay: '₹99', durationDays: 30, features: ['All premium files', 'Unlimited downloads', 'Ad-free', 'Mock tests', 'Priority support'], buttonClass: 'bg-green-600', popular: true },
    { name: 'PRO ANNUAL', price: 499, period: 'year', priceDisplay: '₹499', durationDays: 365, monthlyEquivalent: 42, features: ['All Pro features', 'Best value', 'Premium badge', 'Early access'], buttonClass: 'bg-orange-600', popular: true }
  ];

  const handleSubscribe = async (planName, price, durationDays) => {
    if (!user) { navigate('/login'); return; }
    if (price === 0) return;
    if (!razorpayLoaded) { alert('Loading payment gateway...'); return; }
    
    setProcessingPlan(planName);
    setLoading(true);
    try {
      const order = await createRazorpayOrder(price);
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `${planName} Subscription`,
        image: 'https://onlibry.in/logo transparent.png',
        order_id: order.id,
        handler: async (response) => {
          await updateSubscription(user.uid, planName.toLowerCase().replace('pro ', ''), durationDays);
          alert(`Successfully subscribed to ${planName}! 🎉`);
          window.location.reload();
        },
        prefill: { name: user.displayName || '', email: user.email || '' },
        theme: { color: '#22c55e' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
      setProcessingPlan(null);
    }
  };

  const handleCartCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    if (cartItems.length === 0) { alert('Cart is empty'); return; }
    setLoading(true);
    try {
      const order = await createRazorpayOrder(cartTotal);
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `Purchase ${cartItems.length} item(s)`,
        image: 'https://onlibry.in/logo transparent.png',
        order_id: order.id,
        handler: async (response) => {
          alert(`Successfully purchased ${cartItems.length} item(s)! 🎉`);
          clearCart();
          navigate('/saved-files');
        },
        prefill: { name: user.displayName || '', email: user.email || '' },
        theme: { color: '#22c55e' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleCheckout = async (item) => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      const order = await createRazorpayOrder(item.price);
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `Purchase: ${item.name}`,
        image: 'https://onlibry.in/logo transparent.png',
        order_id: order.id,
        handler: async (response) => {
          alert(`Successfully purchased "${item.name}"! 🎉`);
          removeFromCart(item.id);
        },
        prefill: { name: user.displayName || '', email: user.email || '' },
        theme: { color: '#22c55e' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-3 md:py-6">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 text-center">
            <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Processing {processingPlan || 'order'}...</p>
          </div>
        </div>
      )}

      <h1 className="text-xl md:text-3xl font-bold text-center text-gray-800 mb-2">Pricing & Cart</h1>
      <p className="text-xs md:text-sm text-center text-gray-500 mb-5">Choose a plan or purchase files</p>

      <div className="flex justify-center mb-5">
        <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
          <button onClick={() => setActiveTab('subscription')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'subscription' ? 'bg-green-600 text-white' : 'text-gray-600'}`}>
            <Crown size={14} className="inline mr-1" /> Plans
          </button>
          <button onClick={() => setActiveTab('cart')} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'cart' ? 'bg-green-600 text-white' : 'text-gray-600'}`}>
            <ShoppingCart size={14} className="inline mr-1" /> Cart ({getCartCount()})
          </button>
        </div>
      </div>

      {isSubscribed && activeTab === 'subscription' && (
        <div className="bg-green-50 rounded-lg p-3 text-center mb-5">
          <p className="text-green-700 text-sm">🎉 You are on <strong>{subscriptionType?.toUpperCase()}</strong> plan!</p>
        </div>
      )}

      {activeTab === 'subscription' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = isSubscribed && subscriptionType?.toLowerCase() === plan.name.toLowerCase().replace('pro ', '');
              return (
                <div key={plan.name} className={`relative bg-white rounded-xl shadow-md p-4 border ${plan.popular ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200'}`}>
                  {plan.popular && <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg">POPULAR</div>}
                  <h3 className="text-base font-bold text-gray-800">{plan.name}</h3>
                  <div className="mt-2 mb-3">
                    <span className="text-2xl font-bold">{plan.priceDisplay}</span>
                    {plan.period !== 'lifetime' && <span className="text-xs text-gray-500">/{plan.period}</span>}
                  </div>
                  {plan.monthlyEquivalent && <p className="text-[10px] text-green-600 mb-3">Just ₹{plan.monthlyEquivalent}/month</p>}
                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f, i) => <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600"><Check size={10} className="text-green-500" />{f}</li>)}
                  </ul>
                  <button onClick={() => handleSubscribe(plan.name, plan.price, plan.durationDays)} disabled={isCurrent || plan.price === 0} className={`w-full py-2 rounded-lg text-white text-sm font-medium ${isCurrent ? 'bg-gray-400' : plan.buttonClass} disabled:opacity-50`}>
                    {isCurrent ? 'Current Plan' : plan.buttonText || (plan.name === 'FREE' ? 'Current' : 'Upgrade')}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center">
            <h3 className="font-semibold text-gray-800 mb-2">Need Just One File?</h3>
            <button onClick={() => setActiveTab('cart')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">View Cart ({getCartCount()})</button>
          </div>
        </>
      )}

      {activeTab === 'cart' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-green-600 p-3 text-white">
            <h2 className="font-bold text-base">Your Cart</h2>
            <p className="text-[11px] opacity-90">Review and purchase</p>
          </div>
          {cartItems.length === 0 ? (
            <div className="p-8 text-center"><ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-gray-500 text-sm">Cart is empty</p><button onClick={() => navigate('/files')} className="mt-3 text-green-600 text-sm">Browse Files</button></div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {cartItems.map(item => (
                  <div key={item.id} className="p-3 flex justify-between items-center">
                    <div><h3 className="font-medium text-sm">{item.name}</h3><p className="text-[10px] text-gray-400">{item.type === 'file' ? '📄 File' : item.type === 'mocktest' ? '📝 Mock Test' : '❓ Quiz'}</p></div>
                    <div className="text-right"><p className="font-bold text-green-600 text-sm">₹{item.price}</p><div className="flex gap-2 mt-1"><button onClick={() => handleSingleCheckout(item)} className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded">Buy</button><button onClick={() => removeFromCart(item.id)} className="text-[10px] px-2 py-1 bg-red-500 text-white rounded">Remove</button></div></div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-gray-50 border-t">
                <div className="flex justify-between mb-3"><span className="text-sm font-medium">Total:</span><span className="text-lg font-bold text-green-600">₹{cartTotal}</span></div>
                <button onClick={handleCartCheckout} disabled={!razorpayLoaded} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Checkout (₹{cartTotal})</button>
                <button onClick={clearCart} className="w-full mt-2 py-2 bg-red-500 text-white rounded-lg text-sm">Clear Cart</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PricingPage;