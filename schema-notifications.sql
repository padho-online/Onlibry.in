-- ============================================
-- Onlibry Notifications Database Schema
-- D1 Database: onlibry-notifications
-- ============================================

-- --------------------------------------------
-- 1. QUICK ACCESS BUTTONS TABLE
-- Home page ke quick navigation buttons
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS quick_access_buttons (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    icon TEXT DEFAULT '📁',
    path TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------
-- 2. CATEGORIES TABLE
-- Notification categories (Exam, Academic, Admin, etc.)
-- Admin se add/edit/delete honge
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT 'gray',
    icon TEXT DEFAULT '📝',
    "order" INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------
-- 3. NOTIFICATIONS TABLE
-- Main notifications data
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id TEXT NOT NULL,
    link TEXT,
    image_url TEXT,
    is_pinned INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    scheduled_for TEXT,
    published_at TEXT,
    views INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- --------------------------------------------
-- 4. SLIDER CARDS TABLE
-- Home page carousel slider cards
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS slider_cards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link TEXT,
    button_text TEXT DEFAULT 'View More',
    "order" INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------
-- INDEXES for better performance
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_published ON notifications(published_at);
CREATE INDEX IF NOT EXISTS idx_notifications_pinned ON notifications(is_pinned);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_quick_access_active ON quick_access_buttons(is_active);
CREATE INDEX IF NOT EXISTS idx_slider_cards_active ON slider_cards(is_active);

-- --------------------------------------------
-- INSERT DEFAULT DATA
-- --------------------------------------------

-- Default Quick Access Buttons
INSERT OR REPLACE INTO quick_access_buttons (id, label, icon, path, "order", is_active) VALUES
('qa_files', 'Files', '📁', '/files', 1, 1),
('qa_folders', 'Folders', '📂', '/folders', 2, 1),
('qa_mocktests', 'Mock Tests', '✏️', '/mock-tests', 3, 1),
('qa_quizzes', 'Quiz', '❓', '/quizzes', 4, 1),
('qa_blog', 'Blog', '📝', '/blog', 5, 1);

-- Default Categories
INSERT OR REPLACE INTO categories (id, name, slug, color, icon, "order", is_active) VALUES
('cat_exam', 'Exam Notification', 'exam', 'red', '📝', 1, 1),
('cat_academic', 'Academic Notification', 'academic', 'blue', '📚', 2, 1),
('cat_admin', 'Admin Notification', 'admin', 'green', '👑', 3, 1),
('cat_others', 'Others', 'others', 'gray', '🎯', 4, 1);

-- Default Slider Cards (Example)
INSERT OR REPLACE INTO slider_cards (id, title, description, image_url, link, button_text, "order", is_active) VALUES
('slide_1', 'Welcome to Onlibry', 'Your one-stop platform for educational resources', 'https://onlibry.in/logo.png', '/files', 'Explore Now', 1, 1),
('slide_2', 'Mock Tests Available', 'Practice with real exam patterns', 'https://onlibry.in/logo.png', '/mock-tests', 'Start Practice', 2, 1),
('slide_3', 'Study Materials', 'Access thousands of study materials', 'https://onlibry.in/logo.png', '/files', 'Browse Files', 3, 1);

-- Default Notifications (Examples)
INSERT OR REPLACE INTO notifications (id, title, content, category_id, link, is_pinned, status, published_at, views) VALUES
('notif_1', 'Welcome to Onlibry!', 'Thank you for choosing Onlibry. Start exploring our educational resources.', 'cat_others', NULL, 1, 'published', datetime('now'), 0),
('notif_2', 'New Mock Tests Added', 'We have added 50+ new mock tests for various competitive exams.', 'cat_exam', '/mock-tests', 0, 'published', datetime('now'), 0);