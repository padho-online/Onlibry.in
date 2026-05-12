// src/blogger/services/blogService.js
// ✅ FIXED: Better error handling for getBlogPostById

const API_URL = import.meta.env.VITE_BLOG_API_URL;

// Helper: Get auth token
function getAuthToken() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user?.uid || null;
}

// Helper: Headers
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getAuthToken(),
  };
}

// ============================================
// BLOG POST CRUD OPERATIONS
// ============================================

// Get all published posts
export async function getAllBlogPosts(limit = 20) {
  try {
    const response = await fetch(`${API_URL}/api/posts?limit=${limit}`);
    const data = await response.json();
    return data.success ? data.posts : [];
  } catch (error) {
    console.error('Get posts error:', error);
    return [];
  }
}

// Get single post by slug
export async function getBlogPostBySlug(slug) {
  try {
    const response = await fetch(`${API_URL}/api/post/${slug}`);
    const data = await response.json();
    return data.success ? data.post : null;
  } catch (error) {
    console.error('Get post by slug error:', error);
    return null;
  }
}

// ✅ FIXED: Get post by ID with full URL check
export async function getBlogPostById(postId) {
  console.log('📡 Fetching post by ID:', postId);
  console.log('📡 ID type:', typeof postId);
  console.log('📡 ID length:', postId?.length);
  console.log('📡 API URL:', API_URL);
  
  if (!postId) {
    console.error('❌ Invalid post ID:', postId);
    return null;
  }

  try {
    const url = `${API_URL}/api/post/id/${postId}`;
    console.log('📡 Full URL:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.error('❌ Post not found (404)');
        return null;
      }
      console.error('❌ HTTP error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('📡 Response data:', data);
    return data.success ? data.post : null;
  } catch (error) {
    console.error('❌ Get post by ID error:', error);
    return null;
  }
}

// Get user's all posts (for dashboard)
export async function getUserPosts(userId) {
  try {
    const response = await fetch(`${API_URL}/api/user/posts/${userId}`);
    const data = await response.json();
    return data.success ? data.posts : [];
  } catch (error) {
    console.error('Get user posts error:', error);
    return [];
  }
}

// Create new post
export async function createBlogPost(post) {
  try {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(post),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create post error:', error);
    return { success: false, error: error.message };
  }
}

// Update post
export async function updateBlogPost(postId, updates) {
  try {
    const response = await fetch(`${API_URL}/api/posts/${postId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update post error:', error);
    return { success: false, error: error.message };
  }
}

// Delete post
export async function deleteBlogPost(postId) {
  try {
    const response = await fetch(`${API_URL}/api/posts/${postId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete post error:', error);
    return { success: false, error: error.message };
  }
}

// Upload image to Cloudinary
export async function uploadImage(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
}

// Like post
export async function likePost(postId) {
  try {
    const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Like error:', error);
    return { success: false };
  }
}

// Save post (bookmark)
export async function savePost(postId) {
  try {
    const response = await fetch(`${API_URL}/api/posts/${postId}/save`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Save error:', error);
    return { success: false };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function calculateReadingTime(content) {
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { minutes, text: `${minutes} min read` };
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}