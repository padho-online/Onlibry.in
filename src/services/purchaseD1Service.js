// src/services/purchaseD1Service.js
// Purchase service using D1 database (Cloudflare)

const API_URL = import.meta.env.VITE_NOTIFICATION_API_URL;

// Save purchase to D1 database
export async function savePurchaseToD1(purchaseData) {
  try {
    const response = await fetch(`${API_URL}/api/purchase/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purchaseData)
    });
    
    const data = await response.json();
    console.log('📦 Purchase saved to D1:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error saving purchase to D1:', error);
    return { success: false, error: error.message };
  }
}

// Get user's all purchases from D1
export async function getUserPurchasesFromD1(userId) {
  try {
    const response = await fetch(`${API_URL}/api/purchase/user/${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.purchases || [];
    }
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching purchases from D1:', error);
    return [];
  }
}

// Check if user purchased a specific file
export async function checkPurchaseInD1(userId, fileId) {
  try {
    const response = await fetch(`${API_URL}/api/purchase/check?userId=${userId}&fileId=${encodeURIComponent(fileId)}`);
    const data = await response.json();
    
    if (data.success) {
      return data.purchased === true;
    }
    return false;
    
  } catch (error) {
    console.error('❌ Error checking purchase in D1:', error);
    return false;
  }
}