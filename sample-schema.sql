-- Sample Database Schema for Testing SQL Import
-- This file contains various SQL constructs to test the parser

-- Users table with comprehensive column types and constraints
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB COLLATE=utf8mb4_unicode_ci COMMENT='User accounts and profiles';

-- Categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_slug (slug)
) ENGINE=InnoDB COMMENT='Hierarchical categories';

-- Posts table with multiple foreign keys
CREATE TABLE posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT NOT NULL,
    excerpt TEXT,
    author_id UUID NOT NULL,
    category_id INT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    featured_image_url TEXT,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_posts_author (author_id),
    INDEX idx_posts_category (category_id),
    INDEX idx_posts_status (status),
    INDEX idx_posts_published_at (published_at),
    FULLTEXT INDEX ft_posts_title_content (title, content)
) ENGINE=InnoDB COMMENT='Blog posts and articles';

-- Tags table
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#007bff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Post tags';

-- Post tags junction table
CREATE TABLE post_tags (
    post_id BIGINT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Many-to-many relationship between posts and tags';

-- Comments table with self-referencing foreign key
CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    author_id UUID,
    parent_comment_id BIGINT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100),
    author_email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_comments_post (post_id),
    INDEX idx_comments_author (author_id),
    INDEX idx_comments_parent (parent_comment_id),
    INDEX idx_comments_approved (is_approved)
) ENGINE=InnoDB COMMENT='Post comments with threaded replies';

-- Media attachments table
CREATE TABLE media_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    width INT,
    height INT,
    alt_text TEXT,
    description TEXT,
    uploader_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_media_uploader (uploader_id),
    INDEX idx_media_mime_type (mime_type),
    INDEX idx_media_created_at (created_at)
) ENGINE=InnoDB COMMENT='Media files and attachments';

-- Post media junction table
CREATE TABLE post_media (
    post_id BIGINT NOT NULL,
    media_id BIGINT NOT NULL,
    display_order INT DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, media_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_attachments(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_post_media_order (display_order)
) ENGINE=InnoDB COMMENT='Media attachments for posts';

-- Settings table (simple key-value store)
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value LONGTEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_settings_key (setting_key),
    INDEX idx_settings_public (is_public)
) ENGINE=InnoDB COMMENT='Application settings and configuration';

-- Test table with various data types and constraints
CREATE TABLE test_data_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    varchar_field VARCHAR(255) DEFAULT 'default_value',
    text_field TEXT,
    int_field INT DEFAULT 0,
    bigint_field BIGINT,
    decimal_field DECIMAL(10,2) DEFAULT 0.00,
    float_field FLOAT DEFAULT 0.0,
    double_field DOUBLE DEFAULT 0.0,
    boolean_field BOOLEAN DEFAULT false,
    date_field DATE,
    time_field TIME,
    datetime_field DATETIME,
    timestamp_field TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    json_field JSON,
    enum_field ENUM('option1', 'option2', 'option3') DEFAULT 'option1',
    set_field SET('a', 'b', 'c') DEFAULT NULL,
    binary_field BINARY(16),
    varbinary_field VARBINARY(255),
    char_field CHAR(10) DEFAULT '',
    not_null_field VARCHAR(100) NOT NULL,
    unique_field VARCHAR(100) UNIQUE,
    INDEX idx_test_varchar (varchar_field),
    INDEX idx_test_int (int_field),
    UNIQUE INDEX uk_test_unique (unique_field),
    SPATIAL INDEX idx_test_spatial (binary_field)
) ENGINE=InnoDB COMMENT='Test table for various data types';

-- Add some complex constraints and indexes
ALTER TABLE posts ADD CONSTRAINT chk_posts_status CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE posts ADD CONSTRAINT chk_posts_view_count CHECK (view_count >= 0);
ALTER TABLE posts ADD CONSTRAINT chk_posts_like_count CHECK (like_count >= 0);

-- Create a view for testing (though views won't be parsed, they're good for edge case testing)
CREATE VIEW post_summary AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.status,
    p.published_at,
    p.view_count,
    p.like_count,
    u.username as author_username,
    c.name as category_name,
    COUNT(pt.tag_id) as tag_count
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN post_tags pt ON p.id = pt.post_id
GROUP BY p.id, u.username, c.name;
