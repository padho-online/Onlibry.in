// src/services/notificationService.js
// Notification Service - With Admin CRUD

const API_URL = import.meta.env.VITE_NOTIFICATION_API_URL;
const ADMIN_KEY = import.meta.env.VITE_NOTIFICATION_ADMIN_KEY;

// ============================================
// PUBLIC APIs
// ============================================

// Get latest notifications for home page (limit: 5 by default)
export async function getLatestNotifications(limit = 5) {
  try {
    const response = await fetch(`${API_URL}/api/notifications?limit=${limit}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching latest notifications:', error);
    return [];
  }
}

// Get all notifications with pagination and category filter
export async function getAllNotifications(page = 1, limit = 10, category = 'all') {
  try {
    const url = `${API_URL}/api/notifications/all?page=${page}&limit=${limit}&category=${category}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return {
        notifications: data.data,
        pagination: data.pagination
      };
    }
    return { notifications: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return { notifications: [], pagination: { page: 1, total: 0, totalPages: 0 } };
  }
}

// Get single notification by ID (increments view count automatically)
export async function getNotificationById(id) {
  try {
    const response = await fetch(`${API_URL}/api/notifications/${id}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching notification:', error);
    return null;
  }
}

// ============================================
// ADMIN APIs (Require Admin Key)
// ============================================

// Get all notifications (including drafts) for admin
export async function getAllNotificationsAdmin() {
  try {
    const response = await fetch(`${API_URL}/api/admin/notifications/all`, {
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return [];
  }
}

// Create new notification
export async function createNotification(notificationData) {
  try {
    const response = await fetch(`${API_URL}/api/admin/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(notificationData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

// Update existing notification
export async function updateNotification(id, notificationData) {
  try {
    const response = await fetch(`${API_URL}/api/admin/notifications/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY
      },
      body: JSON.stringify(notificationData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating notification:', error);
    return { success: false, error: error.message };
  }
}

// Delete notification
export async function deleteNotification(id) {
  try {
    const response = await fetch(`${API_URL}/api/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': ADMIN_KEY }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }
}