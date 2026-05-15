// src/pages/admin/PlansEditor.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

function PlansEditor() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [plans, setPlans] = useState({});

  // Default plans (fallback)
  const defaultPlans = {
    free: {
      id: 'free',
      name: 'FREE',
      price: 0,
      period: 'lifetime',
      durationDays: 0,
      features: [
        'Access to free books and resources',
        'Selected PYQs',
        'Limited daily searches',
        'Ads enabled',
        'Online reading only'
      ],
      enabled: true,
      isDefault: true
    },
    monthly: {
      id: 'monthly',
      name: 'PRO MONTHLY',
      price: 99,
      period: 'month',
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
      enabled: true,
      isDefault: true
    },
    yearly: {
      id: 'yearly',
      name: 'PRO ANNUAL',
      price: 499,
      period: 'year',
      durationDays: 365,
      features: [
        'All Pro Monthly features',
        'Best value (Save ₹689/year)',
        'Premium badge',
        'Early access to new features',
        'Priority support + dedicated email'
      ],
      enabled: true,
      isDefault: true
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Auto clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const plansDoc = await getDoc(doc(db, 'config', 'plans'));
      if (plansDoc.exists()) {
        setPlans(plansDoc.data());
      } else {
        setPlans(defaultPlans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans(defaultPlans);
      showMessage('error', 'Failed to load plans. Using defaults.');
    }
    setLoading(false);
  };

  const savePlans = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'plans'), plans);
      showMessage('success', '✅ Plans saved successfully!');
      
      // Save to localStorage as backup
      localStorage.setItem('onlibry_plans_backup', JSON.stringify(plans));
      
    } catch (error) {
      console.error('Error saving plans:', error);
      showMessage('error', '❌ Error saving plans: ' + error.message);
    }
    setSaving(false);
  };

  const addFeature = (planKey) => {
    const newFeature = prompt('Enter new feature (e.g., "24/7 Support"):');
    if (newFeature && newFeature.trim()) {
      setPlans(prev => ({
        ...prev,
        [planKey]: {
          ...prev[planKey],
          features: [...(prev[planKey]?.features || []), newFeature.trim()]
        }
      }));
      showMessage('success', 'Feature added! Click Save to confirm.');
    }
  };

  const editFeature = (planKey, index, newValue) => {
    const updatedFeatures = [...(plans[planKey]?.features || [])];
    updatedFeatures[index] = newValue;
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        features: updatedFeatures
      }
    }));
  };

  const removeFeature = (planKey, index) => {
    if (window.confirm('Remove this feature?')) {
      setPlans(prev => ({
        ...prev,
        [planKey]: {
          ...prev[planKey],
          features: prev[planKey].features.filter((_, i) => i !== index)
        }
      }));
      showMessage('success', 'Feature removed! Click Save to confirm.');
    }
  };

  const updatePlanField = (planKey, field, value) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        [field]: field === 'price' ? parseInt(value) || 0 : value
      }
    }));
  };

  const togglePlan = (planKey) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        enabled: !prev[planKey]?.enabled
      }
    }));
  };

  const addNewPlan = () => {
    const planName = prompt('Enter plan name (e.g., PRO WEEKLY):');
    if (!planName) return;
    
    const planId = planName.toLowerCase().replace(/\s+/g, '_');
    
    if (plans[planId]) {
      alert('Plan with this ID already exists!');
      return;
    }
    
    const duration = prompt('Enter duration in days (e.g., 7 for weekly, 30 for monthly, 365 for yearly):', '30');
    const price = prompt('Enter price in ₹ (e.g., 199):', '199');
    
    setPlans(prev => ({
      ...prev,
      [planId]: {
        id: planId,
        name: planName.toUpperCase(),
        price: parseInt(price) || 199,
        period: getPeriodName(parseInt(duration)),
        durationDays: parseInt(duration) || 30,
        features: ['New feature 1', 'New feature 2'],
        enabled: true,
        isCustom: true
      }
    }));
    showMessage('success', `New plan "${planName}" added! Click Save to confirm.`);
  };

  const getPeriodName = (days) => {
    if (days === 7) return 'week';
    if (days === 30) return 'month';
    if (days === 365) return 'year';
    return `${days} days`;
  };

  const deletePlan = (planKey) => {
    if (plans[planKey]?.isDefault) {
      alert('Default plans cannot be deleted!');
      return;
    }
    
    if (window.confirm(`Delete "${plans[planKey]?.name}" plan permanently?`)) {
      setPlans(prev => {
        const newPlans = { ...prev };
        delete newPlans[planKey];
        return newPlans;
      });
      showMessage('success', 'Plan deleted! Click Save to confirm.');
    }
  };

  const duplicatePlan = (planKey) => {
    const originalPlan = plans[planKey];
    const newName = prompt('Enter new plan name:', `${originalPlan.name} COPY`);
    if (!newName) return;
    
    const newId = newName.toLowerCase().replace(/\s+/g, '_');
    
    setPlans(prev => ({
      ...prev,
      [newId]: {
        ...originalPlan,
        id: newId,
        name: newName.toUpperCase(),
        isDefault: false,
        isCustom: true
      }
    }));
    
    showMessage('success', `Plan duplicated as "${newName}"! Click Save to confirm.`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Message Toast */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-xl font-bold text-gray-800">
          💰 Subscription Plans Editor
        </h2>
        <div className="flex gap-2">
          <button
            onClick={addNewPlan}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
          >
            ➕ Add New Plan
          </button>
          <button
            onClick={savePlans}
            disabled={saving}
            className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-1"
          >
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        ⚡ Changes made here will affect subscription pricing and features immediately.
      </p>

      <div className="space-y-6">
        {Object.entries(plans).map(([key, plan]) => (
          <div 
            key={key} 
            className={`border rounded-lg p-5 transition-all ${
              plan.enabled !== false 
                ? 'border-green-300 bg-white shadow-sm' 
                : 'border-gray-200 bg-gray-50 opacity-70'
            }`}
          >
            {/* Plan Header */}
            <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={plan.enabled !== false}
                  onChange={() => togglePlan(key)}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <h3 className="text-lg font-bold text-gray-800">
                  {plan.name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  plan.enabled !== false 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {plan.enabled !== false ? '✅ Active' : '⛔ Disabled'}
                </span>
                {plan.isDefault && (
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => duplicatePlan(key)}
                  className="text-purple-600 hover:text-purple-800 text-sm px-2 py-1"
                  title="Duplicate Plan"
                >
                  📋 Duplicate
                </button>
                {!plan.isDefault && (
                  <button
                    onClick={() => deletePlan(key)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>

            {/* Plan Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={plan.name || ''}
                  onChange={(e) => updatePlanField(key, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={plan.enabled === false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={plan.price || 0}
                  onChange={(e) => updatePlanField(key, 'price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={plan.enabled === false}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  value={plan.period || 'month'}
                  onChange={(e) => {
                    let days = 30;
                    if (e.target.value === 'week') days = 7;
                    else if (e.target.value === 'month') days = 30;
                    else if (e.target.value === 'year') days = 365;
                    updatePlanField(key, 'period', e.target.value);
                    updatePlanField(key, 'durationDays', days);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={plan.enabled === false}
                >
                  <option value="week">Weekly (7 days)</option>
                  <option value="month">Monthly (30 days)</option>
                  <option value="year">Yearly (365 days)</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
            </div>

            {/* Features Section */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features Included
              </label>
              <div className="space-y-2">
                {(plan.features || []).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-green-500 text-lg">✓</span>
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => editFeature(key, idx, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      disabled={plan.enabled === false}
                      placeholder="Feature description"
                    />
                    <button
                      onClick={() => removeFeature(key, idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={plan.enabled === false}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addFeature(key)}
                className="mt-3 text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                disabled={plan.enabled === false}
              >
                ➕ Add Feature
              </button>
            </div>

            {/* Preview Section */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                📌 This plan will be shown on pricing page with {plan.features?.length || 0} features
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {Object.keys(plans).length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No plans found. Click "Add New Plan" to create one.</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ How Plans Work</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Price</strong> - Amount user pays for subscription</li>
          <li>• <strong>Duration</strong> - How long subscription lasts (week/month/year)</li>
          <li>• <strong>Features</strong> - List of benefits shown on pricing page</li>
          <li>• <strong>Disabled plans</strong> - Won't appear on pricing page</li>
          <li>• <strong>Default plans</strong> - Cannot be deleted, only modified</li>
          <li>• <strong>Save Changes</strong> - Don't forget to click Save after editing!</li>
        </ul>
      </div>
    </div>
  );
}

export default PlansEditor;