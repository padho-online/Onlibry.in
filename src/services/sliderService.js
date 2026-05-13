// src/services/sliderService.js
// Slider Cards Service - With Admin CRUD

const API_URL = import.meta.env.VITE_NOTIFICATION_API_URL;
const ADMIN_KEY = import.meta.env.VITE_NOTIFICATION_ADMIN_KEY;

// Cache
let cachedCards = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

function isCacheValid() {
  if (!cachedCards || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
}

// ============================================
// PUBLIC API
// ============================================

// Get all active slider cards (for home page)
export async function getSliderCards(forceRefresh = false) {
  if (forceRefresh) {
    cachedCards = null;
    lastFetchTime = null;
  }
  
  if (isCacheValid() && cachedCards) {
    return cachedCards;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/slider-cards`);
    const data = await response.json();
    
    if (data.success) {
      cachedCards = data.data;
      lastFetchTime = Date.now();
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching slider cards:', error);
    return [];
  }
}

// ============================================
// ADMIN API (Requires Admin Key)
// ============================================

// Get all slider cards (including inactive) for admin
export async function getAllSliderCardsAdmin() {
  try {
    const response = await fetch(`${API_URL}/api/admin/slider-cards/all`, {
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching all slider cards:', error);
    return [];
  }
}

// Add new slider card
export async function addSliderCard(cardData) {
  try {
    const response = await fetch(`${API_URL}/api/admin/slider-cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(cardData)
    });
    const data = await response.json();
    if (data.success) {
      cachedCards = null;
    }
    return data;
  } catch (error) {
    console.error('Error adding slider card:', error);
    return { success: false, error: error.message };
  }
}

// Update slider card
export async function updateSliderCard(id, cardData) {
  try {
    const response = await fetch(`${API_URL}/api/admin/slider-cards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(cardData)
    });
    const data = await response.json();
    if (data.success) {
      cachedCards = null;
    }
    return data;
  } catch (error) {
    console.error('Error updating slider card:', error);
    return { success: false, error: error.message };
  }
}

// Delete slider card
export async function deleteSliderCard(id) {
  try {
    const response = await fetch(`${API_URL}/api/admin/slider-cards/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    const data = await response.json();
    if (data.success) {
      cachedCards = null;
    }
    return data;
  } catch (error) {
    console.error('Error deleting slider card:', error);
    return { success: false, error: error.message };
  }
}

// Reorder slider cards
export async function reorderSliderCards(cards) {
  try {
    const response = await fetch(`${API_URL}/api/admin/slider-cards/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify({ cards })
    });
    const data = await response.json();
    if (data.success) {
      cachedCards = null;
    }
    return data;
  } catch (error) {
    console.error('Error reordering slider cards:', error);
    return { success: false, error: error.message };
  }
}