// src/pages/PricingPage.jsx - Fixed Weekly Plan Detection + Payment Logs + Purchase Logs + D1 Worker Logs
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadRazorpayScript, createRazorpayOrder } from "../services/razorpay";
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CreditCard, ShoppingCart, Trash2, Check, Crown } from 'lucide-react';
import { savePurchaseToD1 } from '../services/d1Service';

const WORKER_URL = 'https://onlibry-main-api.mdhabibul12212141.workers.dev';

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
    { id: 'weekly', name: 'PRO WEEKLY', price: 59, period: 'week', durationDays: 7, features: ['All premium files', 'Unlimited downloads', 'Ad-free', 'Mock tests', 'Priority support'], enabled: true, isPopular: false },
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
            id: plan.id || (plan.name?.toLowerCase().replace(/\s+/g, '_')),
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
    if (planId === 'weekly') return 'bg-blue-600';
    if (planId === 'monthly') return 'bg-green-600';
    if (planId === 'yearly') return 'bg-orange-600';
    return 'bg-green-600';
  };

  const getPeriodText = (period, durationDays) => {
    if (period === 'lifetime') return 'lifetime';
    if (period === 'week') return 'week';
    if (period === 'month') return 'month';
    if (period === 'year') return 'year';
    if (durationDays === 7) return 'week';
    if (durationDays === 30) return 'month';
    if (durationDays === 365) return 'year';
    return period || `${durationDays} days`;
  };

  // ============================================
  // HELPER: LOG PAYMENT TO D1 WORKER
  // ============================================
  const logPaymentToWorker = async (event, planName, amount, status, paymentId, orderId, error = null) => {
    try {
      const body = {
        userId: user?.uid || 'guest',
        userEmail: user?.email || 'guest',
        event: event,
        plan: planName,
        amount: amount,
        status: status,
        paymentId: paymentId || null,
        orderId: orderId || null,
        error: error || null
      };
      
      console.log('💰 Sending payment log to Worker:', body);
      
      const response = await fetch(`${WORKER_URL}/api/log/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      console.log('✅ Worker payment log response:', result);
      return result;
    } catch (error) {
      console.error('❌ Worker payment log error:', error);
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // SUBSCRIPTION HANDLER
  // ============================================
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
    
    setProcessingPlan(plan.name);
    setLoading(true);
    
    try {
      const order = await createRazorpayOrder(plan.price);
      console.log('✅ Order created:', order);
      
      let planType = 'monthly';
      let durationDays = 30;
      const planNameLower = (plan.name || '').toLowerCase();
      const planIdLower = (plan.id || '').toLowerCase();
      
      if (planIdLower === 'yearly' || planNameLower.includes('annual') || planNameLower.includes('yearly') || plan.durationDays === 365) {
        planType = 'yearly';
        durationDays = 365;
      }
      else if (planIdLower === 'weekly' || planNameLower.includes('weekly') || plan.durationDays === 7) {
        planType = 'weekly';
        durationDays = 7;
      }
      else if (planIdLower === 'monthly' || planNameLower.includes('monthly') || plan.durationDays === 30) {
        planType = 'monthly';
        durationDays = 30;
      }
      else if (plan.period === 'week') {
        planType = 'weekly';
        durationDays = 7;
      }
      else if (plan.period === 'month') {
        planType = 'monthly';
        durationDays = 30;
      }
      else if (plan.period === 'year') {
        planType = 'yearly';
        durationDays = 365;
      }
      
      console.log('📦 Calculated plan type:', { planType, durationDays, originalName: plan.name });
      
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `${plan.name} Subscription`,
        image: '../assets/logo.png',
        order_id: order.id,
        handler: async (response) => {
          console.log('✅ Payment successful!', response);
          
          try {
            // 🔥 LOG TO D1 WORKER FIRST
            await logPaymentToWorker(
              'subscription_success',
              plan.name,
              plan.price,
              'success',
              response.razorpay_payment_id,
              response.razorpay_order_id
            );
            
            const result = await updateSubscription(user.uid, planType, durationDays);
            console.log('Subscription update result:', result);
            
            if (result.success) {
              // Log to Sheet (backup)
              const { logPaymentEvent } = await import('../services/loggerService');
              await logPaymentEvent(
                'subscription_success',
                plan.name,
                plan.price,
                'success',
                response.razorpay_payment_id,
                response.razorpay_order_id
              );
              
              alert(`Successfully subscribed to ${plan.name}! 🎉`);
              window.location.reload();
            } else {
              alert('Payment successful but subscription update failed. Please contact support.');
            }
          } catch (err) {
            console.error('Subscription update error:', err);
            alert('Error updating subscription. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed by user');
            logPaymentToWorker('subscription_cancelled', plan.name, plan.price, 'cancelled', null, null);
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
      await logPaymentToWorker('subscription_failed', plan.name, plan.price, 'failed', null, null, error.message);
      alert('Payment failed. Please try again. Error: ' + error.message);
      setLoading(false);
      setProcessingPlan(null);
    }
  };

  // ============================================
  // CART CHECKOUT HANDLER
  // ============================================
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
        image: '../assets/logo.png',
        order_id: order.id,
        handler: async (response) => {
          console.log('========== CART PAYMENT SUCCESSFUL ==========');
          
          // 🔥 LOG TO D1 WORKER FIRST
          await logPaymentToWorker(
            'cart_purchase_success',
            `${cartItems.length} items`,
            cartTotal,
            'success',
            response.razorpay_payment_id,
            response.razorpay_order_id
          );
          
          const { logPaymentEvent, logUserPurchase } = await import('../services/loggerService');
          let successCount = 0;
          
          for (const item of cartItems) {
            const finalItemType = item.type || 'file';
            
            // Save to D1
            await savePurchaseToD1({
              userId: user.uid,
              fileId: item.id,
              itemType: finalItemType,
              itemName: item.name,
              price: item.price,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id
            });
            
            // Log payment to Sheet
            await logPaymentEvent(
              'cart_purchase_success',
              item.name,
              item.price,
              'success',
              response.razorpay_payment_id,
              response.razorpay_order_id
            );
            
            // Log user purchase to Sheet
            await logUserPurchase({
              userId: user.uid,
              fileId: item.id,
              itemType: finalItemType,
              itemName: item.name,
              price: item.price,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id
            });
            
            // Save to Firestore
            try {
              const { doc, updateDoc, arrayUnion, serverTimestamp } = await import('firebase/firestore');
              const { db } = await import('../config/firebase');
              
              let firestoreField = 'purchasedFiles';
              if (finalItemType === 'mocktest') firestoreField = 'purchasedMockTests';
              if (finalItemType === 'quiz') firestoreField = 'purchasedQuizzes';
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                [firestoreField]: arrayUnion(item.id),
                lastPurchaseAt: serverTimestamp()
              });
            } catch (fsError) {
              console.error('Firestore error:', fsError);
            }
            
            successCount++;
          }
          
          alert(`Successfully purchased ${successCount} item(s)! 🎉`);
          clearCart();
          
          // Clear cache
          const { clearCache } = await import('../services/cacheService');
          clearCache('files');
          clearCache('mockTests');
          clearCache('quizzes');
          
          navigate('/saved-files');
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
            logPaymentToWorker('cart_purchase_cancelled', `${cartItems.length} items`, cartTotal, 'cancelled', null, null);
            setLoading(false);
          }
        },
        prefill: { name: user.displayName || '', email: user.email || '' },
        theme: { color: '#22c55e' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Checkout error:', error);
      await logPaymentToWorker('cart_purchase_failed', `${cartItems.length} items`, cartTotal, 'failed', null, null, error.message);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SINGLE ITEM CHECKOUT HANDLER
  // ============================================
  const handleSingleCheckout = async (item) => {
    console.log('========== SINGLE CHECKOUT START ==========');
    console.log('📦 Item:', item);
    console.log('📦 Item ID:', item?.id);
    console.log('📦 Item Type:', item?.type);
    console.log('📦 Item Name:', item?.name);
    console.log('📦 Item Price:', item?.price);
    console.log('==========================================');
    
    if (!user) { 
      navigate('/login'); 
      return; 
    }
    
    if (!item.id) {
      console.error('❌ Item ID is missing!');
      alert('Error: Item ID is missing. Please try again.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const order = await createRazorpayOrder(item.price);
      
      const options = {
        key: 'rzp_live_SiS2QOdZl6zCUx',
        amount: order.amount,
        currency: order.currency,
        name: 'Onlibry',
        description: `Purchase: ${item.name}`,
        image: '../assets/logo.png',
        order_id: order.id,
        handler: async (response) => {
          console.log('========== PAYMENT SUCCESSFUL ==========');
          console.log('Payment ID:', response.razorpay_payment_id);
          
          const finalItemType = item.type || 'file';
          let firestoreField = 'purchasedFiles';
          if (finalItemType === 'mocktest') firestoreField = 'purchasedMockTests';
          if (finalItemType === 'quiz') firestoreField = 'purchasedQuizzes';
          
          console.log(`📦 Item Type: ${finalItemType}, Firestore Field: ${firestoreField}`);
          
          // 🔥 LOG TO D1 WORKER FIRST
          await logPaymentToWorker(
            'single_purchase_success',
            item.name,
            item.price,
            'success',
            response.razorpay_payment_id,
            response.razorpay_order_id
          );
          
          // ============================================
          // 1. SAVE TO D1 DATABASE
          // ============================================
          try {
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
          
          // ============================================
          // 2. LOG PAYMENT TO GOOGLE SHEET (Backup)
          // ============================================
          try {
            const { logPaymentEvent } = await import('../services/loggerService');
            await logPaymentEvent(
              'single_purchase_success',
              item.name,
              item.price,
              'success',
              response.razorpay_payment_id,
              response.razorpay_order_id
            );
            console.log('✅ Payment logged to Sheet');
          } catch (logError) {
            console.error('❌ Payment log error:', logError);
          }
          
          // ============================================
          // 3. LOG USER PURCHASE TO GOOGLE SHEET (Backup)
          // ============================================
          try {
            const { logUserPurchase } = await import('../services/loggerService');
            await logUserPurchase({
              userId: user.uid,
              fileId: item.id,
              itemType: finalItemType,
              itemName: item.name,
              price: item.price,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id
            });
            console.log('✅ User purchase logged to Sheet');
          } catch (purchaseError) {
            console.error('❌ User purchase log error:', purchaseError);
          }
          
          // ============================================
          // 4. SAVE TO FIRESTORE (Backup)
          // ============================================
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
          
          // ============================================
          // 5. REMOVE FROM CART
          // ============================================
          removeFromCart(item.id);
          
          // ============================================
          // 6. CLEAR CACHE
          // ============================================
          try {
            const { clearCache } = await import('../services/cacheService');
            clearCache('files');
            clearCache('mockTests');
            clearCache('quizzes');
            console.log('✅ Cache cleared');
          } catch (cacheError) {
            console.error('❌ Cache clear error:', cacheError);
          }
          
          alert(`Successfully purchased "${item.name}"! 🎉`);
          window.location.href = '/saved-files';
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
            logPaymentToWorker('single_purchase_cancelled', item.name, item.price, 'cancelled', null, null);
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
      await logPaymentToWorker('single_purchase_failed', item.name, item.price, 'failed', null, null, error.message);
      alert('Purchase failed. Please try again.');
      setLoading(false);
    }
  };

  // Check if user is on current plan
  const isCurrentPlan = (plan) => {
    if (!isSubscribed) return false;
    const currentType = subscriptionType?.toLowerCase();
    if (plan.id === 'free') return false;
    if (plan.id === 'weekly' && currentType === 'weekly') return true;
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
                        {item.type === 'file' ? '📄 File' : item.type === 'mocktest' ? '📝 Mock Test' : item.type === 'quiz' ? '❓ Quiz' : ''}
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