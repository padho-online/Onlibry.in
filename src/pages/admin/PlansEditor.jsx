import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function PlansEditor() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState({
    free: {
      name: 'FREE',
      price: 0,
      period: 'lifetime',
      features: [
        'Access to free books and resources',
        'Selected PYQs',
        'Limited daily searches',
        'Ads enabled',
        'Online reading only'
      ],
      enabled: true
    },
    monthly: {
      name: 'PRO MONTHLY',
      price: 99,
      period: 'month',
      features: [
        'Access to all premium files',
        'Unlimited online reading',
        'Unlimited downloads',
        'Ad-free experience',
        'Full video access',
        'Mock tests included',
        'Priority support'
      ],
      enabled: true
    },
    yearly: {
      name: 'PRO ANNUAL',
      price: 499,
      period: 'year',
      features: [
        'All Pro Monthly features',
        'Best value (Save ₹689/year)',
        'Premium badge',
        'Early access to new features',
        'Priority support + dedicated email'
      ],
      enabled: true
    }
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const plansDoc = await getDoc(doc(db, 'config', 'plans'));
      if (plansDoc.exists()) {
        setPlans(plansDoc.data());
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
    setLoading(false);
  };

  const savePlans = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'plans'), plans);
      alert('Plans saved successfully!');
    } catch (error) {
      console.error('Error saving plans:', error);
      alert('Error saving plans: ' + error.message);
    }
    setSaving(false);
  };

  const addFeature = (planKey) => {
    const newFeature = prompt('Enter new feature:');
    if (newFeature) {
      setPlans(prev => ({
        ...prev,
        [planKey]: {
          ...prev[planKey],
          features: [...prev[planKey].features, newFeature]
        }
      }));
    }
  };

  const removeFeature = (planKey, index) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        features: prev[planKey].features.filter((_, i) => i !== index)
      }
    }));
  };

  const updatePrice = (planKey, price) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        price: parseInt(price) || 0
      }
    }));
  };

  const togglePlan = (planKey) => {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        enabled: !prev[planKey].enabled
      }
    }));
  };

  const addNewPlan = () => {
    const planName = prompt('Enter plan name (e.g., PRO WEEKLY):');
    if (planName) {
      const planKey = planName.toLowerCase().replace(/\s+/g, '_');
      setPlans(prev => ({
        ...prev,
        [planKey]: {
          name: planName.toUpperCase(),
          price: 49,
          period: 'week',
          features: ['New feature 1', 'New feature 2'],
          enabled: true
        }
      }));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading plans...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Subscription Plans Editor
        </h2>
        <div className="flex gap-2">
          <button
            onClick={addNewPlan}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            + Add New Plan
          </button>
          <button
            onClick={savePlans}
            disabled={saving}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(plans).map(([key, plan]) => (
          <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={plan.enabled}
                  onChange={() => togglePlan(key)}
                  className="w-5 h-5"
                />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {plan.name}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  plan.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {plan.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              {key !== 'free' && key !== 'monthly' && key !== 'yearly' && (
                <button
                  onClick={() => {
                    if (window.confirm('Delete this plan?')) {
                      setPlans(prev => {
                        const newPlans = { ...prev };
                        delete newPlans[key];
                        return newPlans;
                      });
                    }
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={plan.price}
                  onChange={(e) => updatePrice(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  disabled={!plan.enabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period
                </label>
                <input
                  type="text"
                  value={plan.period}
                  onChange={(e) => setPlans(prev => ({
                    ...prev,
                    [key]: { ...prev[key], period: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  disabled={!plan.enabled}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Features
              </label>
              <div className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const newFeatures = [...plan.features];
                        newFeatures[idx] = e.target.value;
                        setPlans(prev => ({
                          ...prev,
                          [key]: { ...prev[key], features: newFeatures }
                        }));
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                      disabled={!plan.enabled}
                    />
                    <button
                      onClick={() => removeFeature(key, idx)}
                      className="text-red-500 hover:text-red-700"
                      disabled={!plan.enabled}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addFeature(key)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                disabled={!plan.enabled}
              >
                + Add Feature
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlansEditor;