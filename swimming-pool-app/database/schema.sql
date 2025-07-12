-- Swimming Pool Management System Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS swimming_pool_db;
USE swimming_pool_db;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Pass types table
CREATE TABLE pass_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default pass types
INSERT INTO pass_types (name, description, price, duration_days) VALUES 

('Daily Pass', 'Access to swimming pool for one day', 0.01, 1),
('Monthly Pass', 'Access to swimming pool for one month', 0.002, 30),
('Yearly Pass', 'Access to swimming pool for one year', 10.00, 365);
=======
('Daily Pass', 'Access to swimming pool for one day', 15.00, 1),
('Monthly Pass', 'Access to swimming pool for one month', 120.00, 30),
('Yearly Pass', 'Access to swimming pool for one year', 1000.00, 365);


-- User passes table
CREATE TABLE user_passes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pass_type_id INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    qr_code_data TEXT NOT NULL,
    payment_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pass_type_id) REFERENCES pass_types(id)
);

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pass_type_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    payment_intent_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pass_type_id) REFERENCES pass_types(id)
);

-- Pool entries table (for tracking QR scans)
CREATE TABLE pool_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_pass_id INT NOT NULL,
    user_id INT NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    staff_id VARCHAR(50),
    notes TEXT,
    FOREIGN KEY (user_pass_id) REFERENCES user_passes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_passes_user_id ON user_passes(user_id);
CREATE INDEX idx_user_passes_status ON user_passes(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_pool_entries_user_id ON pool_entries(user_id);
CREATE INDEX idx_pool_entries_entry_time ON pool_entries(entry_time);