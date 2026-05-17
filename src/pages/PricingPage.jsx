// src/pages/PricingPage.jsx - Complete Fixed with Payment Logs
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadRazorpayScript, createRazorpayOrder, logPaymentEvent } from "../services/razorpay";
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CreditCard, ShoppingCart, Trash2, Zap, Check, Crown, Calendar, Lock } from 'lucide-react';
import { logPaymentToD1 } from '../services/d1Service';

function PricingPage() {
  const { user, isSubscribed, subscriptionType, updateSubscription } = useAuth();
  const { cartItems, cartTotal, removeFromCart, clearCart, getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('subscription');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Default plans (fallback if Firestore fails)
  const defaultPlans = [
    { id: 'free', name: 'FREE', price: 0, period: 'lifetime', durationDays: 0, features: ['Access to free resources', 'Selected PYQs', 'Limited searches', 'Ads enabled'], enabled: true, isPopular: false },
    { id: 'monthly', name: 'PRO MONTHLY', price: 99, period: 'month', durationDays: 30, features: ['All premium files', 'Unlimited downloads', 'Ad-free', 'Mock tests', 'Priority support'], enabled: true, isPopular: true },
    { id: 'yearly', name: 'PRO ANNUAL', price: 499, period: 'year', durationDays: 365, features: ['All Pro features', 'Best value', 'Premium badge', 'Early access'], enabled: true, isPopular: true, monthlyEquivalent: 42 }
  ];

  useEffect(() => {
    loadRazorpayScript().then(setRazorpayLoaded);
    if (location.state?.activeTab === 'cart') setActiveTab('cart');
    loadPlans();
  }, []);

const loadPlans = async () => {
  setPlansLoading(true);
  try {
    const plansDoc = await getDoc(doc(db, 'config', 'plans'));
    if (plansDoc.exists()) {
      const plansData = plansDoc.data();
      const plansArray = Object.values(plansData)
        .filter(plan => plan.enabled !== false)
        .map(plan => ({
          ...plan,
          id: plan.id || (plan.name?.toLowerCase().replace(/\s+/g, '_')), // 🔥 Ensure id exists
          priceDisplay: plan.price === 0 ? 'Free' : `₹${plan.price}`,
          buttonClass: getButtonClass(plan.id),
          isPopular: plan.id === 'monthly' || plan.id === 'yearly'
        }))
        .sort((a, b) => a.price - b.price);
      setPlans(plansArray);
    } else {
      setPlans(defaultPlans);
    }
  } catch (error) {
    console.error('Error loading plans:', error);
    setPlans(defaultPlans);
  }
  setPlansLoading(false);
};

  const getButtonClass = (planId) => {
    if (planId === 'free') return 'bg-gray-500';
    if (planId === 'monthly') return 'bg-green-600';
    if (planId === 'yearly') return 'bg-orange-600';
    return 'bg-green-600';
  };

  const getPeriodText = (period, durationDays) => {
    if (period === 'lifetime') return 'lifetime';
    if (period === 'month') return 'month';
    if (period === 'year') return 'year';
    if (durationDays === 7) return 'week';
    if (durationDays === 30) return 'month';
    if (durationDays === 365) return 'year';
    return period || `${durationDays} days`;
  };

  // Log payment to Google Sheet
  const logPayment = async (event, plan, amount, status, paymentId = null, orderId = null, error = null) => {
    try {
      const SHEET_API_URL = import.meta.env.VITE_SHEET_API_URL;
      if (SHEET_API_URL) {
        await fetch(SHEET_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'paymentLog',
            event: event,
            userId: user?.uid || 'guest',
            userEmail: user?.email || 'guest',
            plan: plan,
            amount: amount,
            status: status,
            paymentId: paymentId,
            orderId: orderId,
            error: error,
            timestamp: new Date().toISOString()
          })
        });
      }
      console.log(`✅ Payment logged: ${event} - ${status}`);
    } catch (err) {
      console.error('Payment logging failed:', err);
    }
  };
const handleSubscribe = async (plan) => {
  console.log('🚀 handleSubscribe called with plan:', plan);
  
  if (!user) { 
    navigate('/login', { state: { from: '/pricing' } }); 
    return; 
  }
  
  if (plan.price === 0) return;
  if (!razorpayLoaded) { 
    alert('Loading payment gateway...'); 
    return; 
  }
  
  // Log payment initiation
  await logPayment('payment_initiated', plan.name, plan.price, 'pending');
  
  setProcessingPlan(plan.name);
  setLoading(true);
  
  try {
    const order = await createRazorpayOrder(plan.price);
    console.log('✅ Order created:', order);
    
    // Log order created
    await logPayment('order_created', plan.name, plan.price, 'pending', null, order.id);
    
    // 🔥 FIX: Determine plan type and duration safely
    let planType = 'monthly';
    let durationDays = 30;
    
    if (plan.id === 'yearly' || plan.name?.toLowerCase().includes('annual') || plan.name?.toLowerCase().includes('yearly')) {
      planType = 'yearly';
      durationDays = 365;
    } else if (plan.id === 'monthly' || plan.name?.toLowerCase().includes('monthly')) {
      planType = 'monthly';
      durationDays = 30;
    } else if (plan.durationDays) {
      durationDays = plan.durationDays;
      if (durationDays === 365) planType = 'yearly';
      else if (durationDays === 30) planType = 'monthly';
      else if (durationDays === 7) planType = 'weekly';
    }
    
    console.log('📝 Determined planType:', planType);
    console.log('📝 Determined durationDays:', durationDays);
    
    const options = {
      key: 'rzp_live_SiS2QOdZl6zCUx',
      amount: order.amount,
      currency: order.currency,
      name: 'Onlibry',
      description: `${plan.name} Subscription`,
      image: 'https://onlibry.in/logo transparent.png',
      order_id: order.id,
      handler: async (response) => {
        console.log('✅ Payment successful!', response);
        
        // Log payment success
        await logPayment('payment_success', plan.name, plan.price, 'success', response.razorpay_payment_id, response.razorpay_order_id);
        
        try {
          // 🔥 FIX: Pass correct parameters
          const result = await updateSubscription(user.uid, planType, durationDays);
          console.log('Subscription update result:', result);
          
          if (result.success) {
            await logPayment('subscription_updated', plan.name, plan.price, 'success', response.razorpay_payment_id);
            alert(`Successfully subscribed to ${plan.name}! 🎉`);
            window.location.reload();
          } else {
            await logPayment('subscription_update_failed', plan.name, plan.price, 'failed', response.razorpay_payment_id, null, result.error);
            alert('Payment successful but subscription update failed. Please contact support.');
          }
        } catch (err) {
          console.error('Subscription update error:', err);
          await logPayment('subscription_update_error', plan.name, plan.price, 'failed', response.razorpay_payment_id, null, err.message);
          alert('Error updating subscription. Please contact support.');
        }
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal closed by user');
          logPayment('payment_cancelled', plan.name, plan.price, 'cancelled');
          setLoading(false);
          setProcessingPlan(null);
        }
      },
      prefill: { 
        name: user.displayName || '', 
        email: user.email || '' 
      },
      theme: { color: '#22c55e' }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.open();
    
  } catch (error) {
    console.error('Payment error:', error);
    await logPayment('payment_error', plan.name, plan.price, 'failed', null, null, error.message);
    alert('Payment failed. Please try again. Error: ' + error.message);
    setLoading(false);
    setProcessingPlan(null);
  }
};

  const handleCartCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    if (cartItems.length === 0) { alert('Cart is empty'); return; }
    
    await logPayment('cart_checkout_initiated', 'Cart Purchase', cartTotal, 'pending');
    setLoading(true);
    
    try {
      const order = await createRazorpayOrder(cartTotal);
      await logPayment('cart_order_created', 'Cart Purchase', cartTotal, 'pending', null, order.id);
      
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `Purchase ${cartItems.length} item(s)`,
        image: 'https://onlibry.in/logo transparent.png',
        order_id: order.id,
        handler: async (response) => {
          await logPayment('cart_payment_success', 'Cart Purchase', cartTotal, 'success', response.razorpay_payment_id, response.razorpay_order_id);
          alert(`Successfully purchased ${cartItems.length} item(s)! 🎉`);
          clearCart();
          navigate('/saved-files');
        },
        modal: {
          ondismiss: () => {
            logPayment('cart_payment_cancelled', 'Cart Purchase', cartTotal, 'cancelled');
            setLoading(false);
          }
        },
        prefill: { name: user.displayName || '', email: user.email || '' },
        theme: { color: '#22c55e' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      await logPayment('cart_payment_error', 'Cart Purchase', cartTotal, 'failed', null, null, error.message);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

const handleSingleCheckout = async (item) => {
  if (!user) { 
    navigate('/login'); 
    return; 
  }
  
  console.log('========== SINGLE CHECKOUT START ==========');
  console.log('Item:', item);
  console.log('Item Type:', item.type);
  
  setLoading(true);
  
  try {
    const order = await createRazorpayOrder(item.price);
    
    const options = {
      key: 'rzp_live_SiS2QOdZl6zCUx',
      amount: order.amount,
      currency: order.currency,
      name: 'Onlibry',
      description: `Purchase: ${item.name}`,
      image: '/logo.png',
      order_id: order.id,
      handler: async (response) => {
        console.log('========== PAYMENT SUCCESSFUL ==========');
        
        // 🔥 Determine the correct item type
        let finalItemType = item.type || 'file';
        let firestoreField = 'purchasedFiles';
        
        if (finalItemType === 'mocktest') {
          firestoreField = 'purchasedMockTests';
        } else if (finalItemType === 'quiz') {
          firestoreField = 'purchasedQuizzes';
        }
        
        console.log(`📦 Item Type: ${finalItemType}, Firestore Field: ${firestoreField}`);
        
        // 1. Save to D1 Database
        try {
          const { savePurchaseToD1 } = await import('../services/d1Service');
          const d1Result = await savePurchaseToD1({
            userId: user.uid,
            fileId: item.id,
            itemType: finalItemType,
            itemName: item.name,
            price: item.price,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id
          });
          console.log('✅ D1 Save Result:', d1Result);
        } catch (d1Error) {
          console.error('❌ D1 error:', d1Error);
        }
        
        // 2. Log payment to D1
        // 2. Log payment to D1
try {
  const { logPaymentToD1 } = await import('../services/d1Service');
  await logPaymentToD1({
    userId: user.uid,
    userEmail: user.email,
    event: 'single_purchase_success',
    plan: item.name,
    amount: item.price,
    status: 'success',
    paymentId: response.razorpay_payment_id,
    orderId: response.razorpay_order_id
  });
  console.log('✅ Payment logged to D1');
} catch (logError) {
  console.error('❌ Payment log error:', logError);
}
        
        // 3. Save to Firestore
        try {
          const { doc, updateDoc, arrayUnion, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('../config/firebase');
          
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            [firestoreField]: arrayUnion(item.id),
            lastPurchaseAt: serverTimestamp()
          });
          console.log(`✅ Firestore updated: ${firestoreField}`);
        } catch (firestoreError) {
          console.error('❌ Firestore error:', firestoreError);
        }
        
        // 4. Remove from cart
        removeFromCart(item.id);
        
        alert(`Successfully purchased "${item.name}"! 🎉`);
        window.location.href = '/saved-files';
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal closed');
          setLoading(false);
        }
      },
      prefill: { 
        name: user.displayName || '', 
        email: user.email || '' 
      },
      theme: { color: '#22c55e' }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.open();
    
  } catch (error) {
    console.error('❌ Payment error:', error);
    alert('Purchase failed. Please try again.');
    setLoading(false);
  }
};

  // Check if user is on current plan
  const isCurrentPlan = (plan) => {
    if (!isSubscribed) return false;
    const currentType = subscriptionType?.toLowerCase();
    if (plan.id === 'free') return false;
    if (plan.id === 'monthly' && currentType === 'monthly') return true;
    if (plan.id === 'yearly' && currentType === 'yearly') return true;
    return plan.id === currentType;
  };

  if (plansLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = isCurrentPlan(plan);
              const periodText = getPeriodText(plan.period, plan.durationDays);
              const monthlyEquivalent = plan.price / (plan.durationDays / 30);
              
              return (
                <div key={plan.id} className={`relative bg-white rounded-xl shadow-md p-4 border ${plan.isPopular ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200'}`}>
                  {plan.isPopular && plan.price > 0 && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg">POPULAR</div>
                  )}
                  <h3 className="text-base font-bold text-gray-800">{plan.name}</h3>
                  <div className="mt-2 mb-3">
                    <span className="text-2xl font-bold">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</span>
                    {periodText !== 'lifetime' && plan.price > 0 && (
                      <span className="text-xs text-gray-500">/{periodText}</span>
                    )}
                  </div>
                  {plan.price > 0 && plan.durationDays > 30 && (
                    <p className="text-[10px] text-green-600 mb-3">Just ₹{Math.round(monthlyEquivalent)}/month</p>
                  )}
                  <ul className="space-y-1.5 mb-4">
                    {(plan.features || []).map((feature, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <Check size={10} className="text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => handleSubscribe(plan)} 
                    disabled={isCurrent || plan.price === 0 || (isSubscribed && plan.price > 0)} 
                    className={`w-full py-2 rounded-lg text-white text-sm font-medium ${isCurrent ? 'bg-gray-400' : plan.buttonClass} disabled:opacity-50`}
                  >
                    {isCurrent ? 'Current Plan' : (plan.price === 0 ? 'Free' : 'Upgrade')}
                  </button>
                </div>
              );
            })}
          </div>
          
          {plans.filter(p => p.price > 0).length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center">
              <h3 className="font-semibold text-gray-800 mb-2">Need Just One File?</h3>
              <button onClick={() => setActiveTab('cart')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">View Cart ({getCartCount()})</button>
            </div>
          )}
        </>
      )}

      {activeTab === 'cart' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-green-600 p-3 text-white">
            <h2 className="font-bold text-base">Your Cart</h2>
            <p className="text-[11px] opacity-90">Review and purchase</p>
          </div>
          {cartItems.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Cart is empty</p>
              <button onClick={() => navigate('/files')} className="mt-3 text-green-600 text-sm">Browse Files</button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {cartItems.map(item => (
                  <div key={item.id} className="p-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-[10px] text-gray-400">
                        {item.type === 'file' ? '📄 File' : item.type === 'mocktest' ? '📝 Mock Test' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-sm">₹{item.price}</p>
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => handleSingleCheckout(item)} className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded">Buy</button>
                        <button onClick={() => removeFromCart(item.id)} className="text-[10px] px-2 py-1 bg-red-500 text-white rounded">Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-gray-50 border-t">
                <div className="flex justify-between mb-3">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold text-green-600">₹{cartTotal}</span>
                </div>
                <button onClick={handleCartCheckout} disabled={!razorpayLoaded} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                  Checkout (₹{cartTotal})
                </button>
                <button onClick={clearCart} className="w-full mt-2 py-2 bg-red-500 text-white rounded-lg text-sm">
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PricingPage;