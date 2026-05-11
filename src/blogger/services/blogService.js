// src/blogger/services/blogService.js
// Using Firestore - Complete working version

import { db } from '../../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where, 
  limit 
} from 'firebase/firestore';

const COLLECTION_NAME = 'blog_posts';

// Get all published blog posts
export async function getAllBlogPosts(limitCount = 50) {
  try {
    const postsQuery = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(postsQuery);
    const posts = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    return posts;
  } catch (error) {
    console.error('Get posts error:', error);
    return [];
  }
}

// Get blog post by slug
export async function getBlogPostBySlug(slug) {
  try {
    const postsQuery = query(
      collection(db, COLLECTION_NAME),
      where('slug', '==', slug)
    );
    const snapshot = await getDocs(postsQuery);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Get post by slug error:', error);
    return null;
  }
}

// Get blog post by ID
export async function getBlogPostById(postId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Get post by ID error:', error);
    return null;
  }
}

// Get user's drafts
export async function getUserDrafts(userId) {
  try {
    const postsQuery = query(
      collection(db, COLLECTION_NAME),
      where('authorId', '==', userId),
      where('status', '==', 'draft'),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(postsQuery);
    const drafts = [];
    snapshot.forEach(doc => {
      drafts.push({ id: doc.id, ...doc.data() });
    });
    return drafts;
  } catch (error) {
    console.error('Get drafts error:', error);
    return [];
  }
}

// Get all user's posts (drafts + published)
export async function getUserPosts(userId) {
  try {
    const postsQuery = query(
      collection(db, COLLECTION_NAME),
      where('authorId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(postsQuery);
    const posts = [];
    snapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    return posts;
  } catch (error) {
    console.error('Get user posts error:', error);
    return [];
  }
}

// Create new blog post
export async function createBlogPost(post) {
  try {
    const postId = `${post.slug}_${Date.now()}`;
    const newPost = {
      ...post,
      id: postId,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, COLLECTION_NAME, postId), newPost);
    console.log('✅ Post created:', postId);
    return { success: true, id: postId };
  } catch (error) {
    console.error('Create post error:', error);
    return { success: false, error: error.message };
  }
}

// Update blog post
export async function updateBlogPost(postId, updates) {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Post updated:', postId);
    return { success: true };
  } catch (error) {
    console.error('Update post error:', error);
    return { success: false, error: error.message };
  }
}

// Delete blog post
export async function deleteBlogPost(postId) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, postId));
    console.log('✅ Post deleted:', postId);
    return { success: true };
  } catch (error) {
    console.error('Delete post error:', error);
    return { success: false, error: error.message };
  }
}

// Increment view count
export async function incrementViewCount(postId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentViews = docSnap.data().views || 0;
      await updateDoc(docRef, { views: currentViews + 1 });
    }
  } catch (error) {
    console.error('Increment views error:', error);
  }
}