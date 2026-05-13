// src/services/categoryService.js
// Category Service - With Admin CRUD

const API_URL = import.meta.env.VITE_NOTIFICATION_API_URL;
const ADMIN_KEY = import.meta.env.VITE_NOTIFICATION_ADMIN_KEY;

// Cache
let cachedCategories = null;
let lastFetchTime = null;
const CACHE_DURATION = 10 * 60 * 1000;

function isCacheValid() {
  if (!cachedCategories || !lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_DURATION;
}

// ============================================
// PUBLIC API
// ============================================

// Get all active categories
export async function getAllCategories(forceRefresh = false) {
  if (forceRefresh) {
    cachedCategories = null;
    lastFetchTime = null;
  }
  
  if (isCacheValid() && cachedCategories) {
    return cachedCategories;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/categories`);
    const data = await response.json();
    
    if (data.success) {
      cachedCategories = data.data;
      lastFetchTime = Date.now();
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Get category by slug
export async function getCategoryBySlug(slug) {
  const categories = await getAllCategories();
  return categories.find(cat => cat.slug === slug) || null;
}

// Get category color class
export function getCategoryColorClass(color) {
  const colorMap = {
    red: 'bg-red-100 text-red-700 border-red-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };
  return colorMap[color] || colorMap.gray;
}

// ============================================
// ADMIN API (Requires Admin Key)
// ============================================

// Get all categories (including inactive) for admin
export async function getAllCategoriesAdmin() {
  try {
    const response = await fetch(`${API_URL}/api/admin/categories/all`, {
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return [];
  }
}

// Add new category
export async function addCategory(categoryData) {
  try {
    const response = await fetch(`${API_URL}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(categoryData)
    });
    const data = await response.json();
    if (data.success) {
      cachedCategories = null;
    }
    return data;
  } catch (error) {
    console.error('Error adding category:', error);
    return { success: false, error: error.message };
  }
}

// Update category
export async function updateCategory(id, categoryData) {
  try {
    const response = await fetch(`${API_URL}/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(categoryData)
    });
    const data = await response.json();
    if (data.success) {
      cachedCategories = null;
    }
    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message };
  }
}

// Delete category
export async function deleteCategory(id) {
  try {
    const response = await fetch(`${API_URL}/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    const data = await response.json();
    if (data.success) {
      cachedCategories = null;
    }
    return data;
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error.message };
  }
}