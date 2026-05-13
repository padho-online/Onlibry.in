// blog-api/src/index.js
// Onlibry Blog API with Cloudflare D1 + Cloudinary

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function cleanExcerpt(html) {
  // Remove all HTML tags and get plain text
  const plainText = html.replace(/<[^>]*>/g, '');
  // Remove extra whitespace and limit to 150 characters
  return plainText.trim().substring(0, 150);
}

async function uploadToCloudinary(fileData, cloudName, apiKey, apiSecret) {
  const formData = new FormData();
  formData.append('file', fileData);
  formData.append('upload_preset', 'onlibry_blog');
  formData.append('folder', 'onlibry-blog');
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  return await response.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    // GET /api/posts - All published posts
    if (method === 'GET' && url.pathname === '/api/posts') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      
      const result = await env.DB.prepare(`
        SELECT id, title, slug, excerpt, meta_title, og_image, tags,
               author_name, published_at, views, created_at
        FROM posts 
        WHERE status = 'published' 
        ORDER BY published_at DESC 
        LIMIT ?
      `).bind(limit).all();
      
      // Format dates and clean excerpt for frontend
      const posts = result.results.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ? cleanExcerpt(post.excerpt) : '',
        meta_title: post.meta_title,
        og_image: post.og_image,
        tags: post.tags,
        author_name: post.author_name,
        published_at: post.published_at,
        views: post.views,
        created_at: post.created_at,
        publishedAt: post.published_at,
        createdAt: post.created_at,
        meta: {
          title: post.meta_title,
          ogImage: post.og_image,
          tags: post.tags,
          description: post.excerpt ? cleanExcerpt(post.excerpt) : ''
        }
      }));
      
      return new Response(JSON.stringify({ success: true, posts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/post/:slug - Single post by slug
    if (method === 'GET' && url.pathname.startsWith('/api/post/') && !url.pathname.includes('/id/')) {
      const slug = url.pathname.split('/api/post/')[1];
      
      const post = await env.DB.prepare(`
        SELECT * FROM posts WHERE slug = ? AND status = 'published'
      `).bind(slug).first();
      
      if (!post) {
        return new Response(JSON.stringify({ success: false, error: 'Post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Increment views
      await env.DB.prepare(`UPDATE posts SET views = views + 1 WHERE id = ?`).bind(post.id).run();
      
      // Format post for frontend
      const formattedPost = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt ? cleanExcerpt(post.excerpt) : cleanExcerpt(post.content),
        publishedAt: post.published_at,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        views: post.views,
        likes: post.likes || 0,
        authorId: post.author_id,
        authorName: post.author_name,
        authorEmail: post.author_email,
        status: post.status,
        meta: {
          title: post.meta_title,
          description: post.meta_description || cleanExcerpt(post.content),
          ogImage: post.og_image,
          tags: post.tags,
          slug: post.slug
        }
      };
      
      return new Response(JSON.stringify({ success: true, post: formattedPost }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/post/id/:postId - Single post by ID (for editing)
    if (method === 'GET' && url.pathname.startsWith('/api/post/id/')) {
      const postId = url.pathname.split('/api/post/id/')[1];
      
      const post = await env.DB.prepare(`
        SELECT * FROM posts WHERE id = ?
      `).bind(postId).first();
      
      if (!post) {
        return new Response(JSON.stringify({ success: false, error: 'Post not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Format post for frontend
      const formattedPost = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt ? cleanExcerpt(post.excerpt) : cleanExcerpt(post.content),
        publishedAt: post.published_at,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        views: post.views,
        likes: post.likes || 0,
        authorId: post.author_id,
        authorName: post.author_name,
        authorEmail: post.author_email,
        status: post.status,
        meta: {
          title: post.meta_title,
          description: post.meta_description || cleanExcerpt(post.content),
          ogImage: post.og_image,
          tags: post.tags,
          slug: post.slug
        }
      };
      
      return new Response(JSON.stringify({ success: true, post: formattedPost }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // GET /api/user/posts/:userId - User's posts
    if (method === 'GET' && url.pathname.startsWith('/api/user/posts/')) {
      const userId = url.pathname.split('/api/user/posts/')[1];
      
      const result = await env.DB.prepare(`
        SELECT id, title, slug, status, published_at, updated_at, views
        FROM posts WHERE author_id = ? ORDER BY updated_at DESC
      `).bind(userId).all();
      
      const posts = result.results.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        publishedAt: post.published_at,
        updatedAt: post.updated_at,
        views: post.views
      }));
      
      return new Response(JSON.stringify({ success: true, posts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/posts - Create post
    if (method === 'POST' && url.pathname === '/api/posts') {
      try {
        const body = await request.json();
        const { title, content, meta, authorId, authorName, authorEmail, status } = body;
        
        if (!title || !content) {
          return new Response(JSON.stringify({ success: false, error: 'Title and content required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const id = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const slug = meta?.slug || generateSlug(title);
        const now = new Date().toISOString();
        const excerpt = cleanExcerpt(content);
        
        await env.DB.prepare(`
          INSERT INTO posts (
            id, title, slug, content, excerpt, meta_title, meta_description, og_image, tags,
            author_id, author_name, author_email, status, published_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, title, slug, content, excerpt,
          meta?.title || title, meta?.description || excerpt, meta?.ogImage || '', meta?.tags || '',
          authorId, authorName, authorEmail,
          status, status === 'published' ? now : null, now, now
        ).run();
        
        return new Response(JSON.stringify({ success: true, postId: id, slug }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Create post error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // PUT /api/posts/:id - Update post
    if (method === 'PUT' && url.pathname.startsWith('/api/posts/')) {
      try {
        const postId = url.pathname.split('/api/posts/')[1];
        const body = await request.json();
        const { title, content, meta, status } = body;
        
        const now = new Date().toISOString();
        const slug = meta?.slug || generateSlug(title);
        const excerpt = cleanExcerpt(content);
        
        await env.DB.prepare(`
          UPDATE posts SET
            title = ?, slug = ?, content = ?, excerpt = ?,
            meta_title = ?, meta_description = ?, og_image = ?, tags = ?,
            status = ?, published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END,
            updated_at = ?
          WHERE id = ?
        `).bind(
          title, slug, content, excerpt,
          meta?.title || title, meta?.description || excerpt, meta?.ogImage || '', meta?.tags || '',
          status, status, now, now, postId
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Update post error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // DELETE /api/posts/:id - Delete post
    if (method === 'DELETE' && url.pathname.startsWith('/api/posts/')) {
      const postId = url.pathname.split('/api/posts/')[1];
      await env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(postId).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/posts/:id/like - Like post
    if (method === 'POST' && url.pathname.match(/\/api\/posts\/.+\/like/)) {
      const postId = url.pathname.split('/api/posts/')[1].split('/like')[0];
      await env.DB.prepare(`UPDATE posts SET likes = likes + 1 WHERE id = ?`).bind(postId).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/posts/:id/save - Save post (bookmark)
    if (method === 'POST' && url.pathname.match(/\/api\/posts\/.+\/save/)) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/upload - Upload image to Cloudinary
    if (method === 'POST' && url.pathname === '/api/upload') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
          return new Response(JSON.stringify({ success: false, error: 'No file uploaded' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const result = await uploadToCloudinary(
          file,
          env.CLOUDINARY_CLOUD_NAME,
          env.CLOUDINARY_API_KEY,
          env.CLOUDINARY_API_SECRET
        );
        
        return new Response(JSON.stringify({ success: true, url: result.secure_url, publicId: result.public_id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 404 - Not found
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};