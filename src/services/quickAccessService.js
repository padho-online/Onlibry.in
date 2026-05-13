// src/services/quickAccessService.js
// Quick Access Buttons Service - With Admin CRUD

const API_URL = import.meta.env.VITE_NOTIFICATION_API_URL;
const ADMIN_KEY = import.meta.env.VITE_NOTIFICATION_ADMIN_KEY;

// Cache
let cachedButtons = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

function isCacheValid() {
  if (!cachedButtons || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
}

// ============================================
// PUBLIC API
// ============================================

// Get all active quick access buttons (for home page)
export async function getQuickAccessButtons(forceRefresh = false) {
  if (forceRefresh) {
    cachedButtons = null;
    lastFetchTime = null;
  }
  
  if (isCacheValid() && cachedButtons) {
    return cachedButtons;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/quick-access`);
    const data = await response.json();
    
    if (data.success) {
      cachedButtons = data.data;
      lastFetchTime = Date.now();
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching quick access buttons:', error);
    return [];
  }
}

// ============================================
// ADMIN API (Requires Admin Key)
// ============================================

// Get all buttons (including inactive) for admin
export async function getAllButtonsAdmin() {
  try {
    const response = await fetch(`${API_URL}/api/admin/quick-access/all`, {
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching all buttons:', error);
    return [];
  }
}

// Add new button
export async function addQuickAccessButton(buttonData) {
  try {
    const response = await fetch(`${API_URL}/api/admin/quick-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(buttonData)
    });
    const data = await response.json();
    if (data.success) {
      cachedButtons = null; // Invalidate cache
    }
    return data;
  } catch (error) {
    console.error('Error adding button:', error);
    return { success: false, error: error.message };
  }
}

// Update button
export async function updateQuickAccessButton(id, buttonData) {
  try {
    const response = await fetch(`${API_URL}/api/admin/quick-access/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(buttonData)
    });
    const data = await response.json();
    if (data.success) {
      cachedButtons = null;
    }
    return data;
  } catch (error) {
    console.error('Error updating button:', error);
    return { success: false, error: error.message };
  }
}

// Delete button
export async function deleteQuickAccessButton(id) {
  try {
    const response = await fetch(`${API_URL}/api/admin/quick-access/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    const data = await response.json();
    if (data.success) {
      cachedButtons = null;
    }
    return data;
  } catch (error) {
    console.error('Error deleting button:', error);
    return { success: false, error: error.message };
  }
}

// Reorder buttons
export async function reorderQuickAccessButtons(buttons) {
  try {
    const response = await fetch(`${API_URL}/api/admin/quick-access/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify({ buttons })
    });
    const data = await response.json();
    if (data.success) {
      cachedButtons = null;
    }
    return data;
  } catch (error) {
    console.error('Error reordering buttons:', error);
    return { success: false, error: error.message };
  }
}