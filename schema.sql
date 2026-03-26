-- ============================================
-- IoTzy Next.js — Database Schema
-- Import ini ke database MySQL Aiven lo
-- ============================================

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NULL,
    `role` VARCHAR(10) NOT NULL DEFAULT 'user',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `session_token` VARCHAR(128) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `sessions_session_token_key`(`session_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `persistent_sessions` (
    `id` VARCHAR(128) NOT NULL,
    `data` MEDIUMTEXT NOT NULL,
    `timestamp` INTEGER UNSIGNED NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `devices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `device_key` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) NOT NULL DEFAULT 'fa-plug',
    `type` VARCHAR(50) NOT NULL DEFAULT 'switch',
    `topic_sub` VARCHAR(200) NULL,
    `topic_pub` VARCHAR(200) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_state` INTEGER NOT NULL DEFAULT 0,
    `latest_state` INTEGER NOT NULL DEFAULT 0,
    `last_seen` DATETIME(3) NULL,
    `last_state_changed` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `device_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `device_id` INTEGER NOT NULL,
    `turned_on_at` DATETIME(3) NOT NULL,
    `turned_off_at` DATETIME(3) NULL,
    `duration_seconds` INTEGER NULL,
    `trigger_type` VARCHAR(50) NOT NULL DEFAULT 'Manual',
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sensors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `sensor_key` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `icon` VARCHAR(50) NOT NULL DEFAULT 'fa-microchip',
    `unit` VARCHAR(20) NULL,
    `topic` VARCHAR(200) NOT NULL,
    `latest_value` DECIMAL(12, 4) NULL,
    `last_seen` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sensor_readings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sensor_id` INTEGER NOT NULL,
    `value` DECIMAL(12, 4) NOT NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `automation_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `sensor_id` INTEGER NULL,
    `device_id` INTEGER NOT NULL,
    `condition_type` VARCHAR(20) NOT NULL,
    `threshold` DECIMAL(10, 4) NULL,
    `threshold_min` DECIMAL(10, 4) NULL,
    `threshold_max` DECIMAL(10, 4) NULL,
    `action` VARCHAR(30) NOT NULL DEFAULT 'on',
    `delay_ms` INTEGER NOT NULL DEFAULT 0,
    `start_time` VARCHAR(5) NULL,
    `end_time` VARCHAR(5) NULL,
    `days` JSON NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `from_template` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `label` VARCHAR(100) NULL,
    `time_hhmm` CHAR(5) NOT NULL,
    `days` JSON NULL,
    `action` VARCHAR(20) NOT NULL DEFAULT 'on',
    `devices` JSON NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `device_name` VARCHAR(100) NOT NULL,
    `activity` VARCHAR(200) NOT NULL,
    `trigger_type` VARCHAR(50) NOT NULL,
    `log_type` VARCHAR(20) NOT NULL DEFAULT 'info',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `activity_logs_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ai_chat_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `sender` VARCHAR(10) NOT NULL,
    `message` TEXT NOT NULL,
    `platform` VARCHAR(20) NOT NULL DEFAULT 'web',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ai_chat_history_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cv_state` (
    `user_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `model_loaded` BOOLEAN NOT NULL DEFAULT false,
    `person_count` INTEGER NOT NULL DEFAULT 0,
    `brightness` INTEGER NOT NULL DEFAULT 0,
    `light_condition` VARCHAR(20) NOT NULL DEFAULT 'unknown',
    `last_updated` DATETIME(3) NOT NULL,
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `mqtt_template` VARCHAR(50) NULL DEFAULT 'hivemq',
    `mqtt_broker` VARCHAR(200) NULL DEFAULT 'broker.hivemq.com',
    `mqtt_port` INTEGER NULL DEFAULT 8884,
    `mqtt_use_ssl` BOOLEAN NULL DEFAULT true,
    `mqtt_username` VARCHAR(100) NULL,
    `mqtt_password_enc` TEXT NULL,
    `mqtt_client_id` VARCHAR(100) NULL,
    `mqtt_path` VARCHAR(100) NULL DEFAULT '/mqtt',
    `telegram_chat_id` VARCHAR(100) NULL,
    `telegram_bot_token` VARCHAR(255) NULL,
    `automation_lamp` BOOLEAN NULL DEFAULT true,
    `automation_fan` BOOLEAN NULL DEFAULT true,
    `automation_lock` BOOLEAN NULL DEFAULT true,
    `lamp_on_threshold` DECIMAL(10, 4) NULL DEFAULT 0.3,
    `lamp_off_threshold` DECIMAL(10, 4) NULL DEFAULT 0.7,
    `fan_temp_high` DECIMAL(10, 4) NULL DEFAULT 30,
    `fan_temp_normal` DECIMAL(10, 4) NULL DEFAULT 25,
    `lock_delay` INTEGER NULL DEFAULT 5000,
    `theme` VARCHAR(20) NULL DEFAULT 'light',
    `quick_control_devices` JSON NULL,
    `cv_rules` JSON NULL,
    `cv_config` JSON NULL,
    `cv_min_confidence` DECIMAL(10, 4) NULL DEFAULT 0.5,
    `cv_dark_threshold` DECIMAL(10, 4) NULL DEFAULT 0.3,
    `cv_bright_threshold` DECIMAL(10, 4) NULL DEFAULT 0.7,
    `cv_human_rules_enabled` BOOLEAN NULL DEFAULT true,
    `cv_light_rules_enabled` BOOLEAN NULL DEFAULT true,
    UNIQUE INDEX `user_settings_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `mqtt_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `broker` VARCHAR(200) NOT NULL,
    `port` INTEGER NOT NULL DEFAULT 1883,
    `use_ssl` BOOLEAN NOT NULL DEFAULT false,
    `username` VARCHAR(100) NULL,
    `path` VARCHAR(100) NULL DEFAULT '/mqtt',
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `mqtt_templates_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign Keys
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `devices` ADD CONSTRAINT `devices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `device_sessions` ADD CONSTRAINT `device_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `device_sessions` ADD CONSTRAINT `device_sessions_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `sensors` ADD CONSTRAINT `sensors_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `sensor_readings` ADD CONSTRAINT `sensor_readings_sensor_id_fkey` FOREIGN KEY (`sensor_id`) REFERENCES `sensors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `automation_rules` ADD CONSTRAINT `automation_rules_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `automation_rules` ADD CONSTRAINT `automation_rules_sensor_id_fkey` FOREIGN KEY (`sensor_id`) REFERENCES `sensors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ai_chat_history` ADD CONSTRAINT `ai_chat_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cv_state` ADD CONSTRAINT `cv_state_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed Data: MQTT Templates
INSERT INTO `mqtt_templates` (`name`, `slug`, `broker`, `port`, `use_ssl`, `username`, `path`, `description`) VALUES
('HiveMQ Cloud', 'hivemq', 'broker.hivemq.com', 8884, 1, NULL, '/mqtt', 'Broker publik HiveMQ dengan SSL/TLS.'),
('EMQX Cloud', 'emqx', 'broker.emqx.io', 8084, 1, NULL, '/mqtt', 'Broker cloud EMQX dengan SSL/TLS.'),
('Mosquitto', 'mosquitto', 'test.mosquitto.org', 8081, 1, NULL, '/mqtt', 'Broker publik Mosquitto.'),
('Localhost', 'local', '127.0.0.1', 8083, 0, NULL, '/mqtt', 'Broker lokal untuk pengembangan.');
