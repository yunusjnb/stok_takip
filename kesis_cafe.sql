-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1:3306
-- Üretim Zamanı: 18 Ara 2025, 23:17:51
-- Sunucu sürümü: 9.1.0
-- PHP Sürümü: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `kesis_cafe`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `admin`
--

DROP TABLE IF EXISTS `admin`;
CREATE TABLE IF NOT EXISTS `admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `type` enum('admin','kasa') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `admin`
--

INSERT INTO `admin` (`id`, `username`, `password`, `created_at`, `type`) VALUES
(1, 'yunusbek', '12345', '2025-12-10 19:11:38', 'admin'),
(2, 'kasa', '12345', '2025-12-10 19:11:38', 'kasa');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `employe`
--

DROP TABLE IF EXISTS `employe`;
CREATE TABLE IF NOT EXISTS `employe` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `surname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary` double NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `position_id` int NOT NULL,
  `annual_leave_limit` int NOT NULL DEFAULT '14',
  `annual_leave_remaining` int NOT NULL DEFAULT '14',
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'tam zamanlı',
  `shift_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `position_id` (`position_id`),
  KEY `fk_employe_shift_template` (`shift_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `employe`
--

INSERT INTO `employe` (`id`, `name`, `surname`, `phone`, `salary`, `created_at`, `position_id`, `annual_leave_limit`, `annual_leave_remaining`, `type`, `shift_id`) VALUES
(1, 'Ahmet', 'Yılmaz', '05320000001', 22000, '2025-12-10 20:31:21', 1, 14, 11, 'tam zamanlı', NULL),
(2, 'Ayşe', 'Kara', '05320000002', 19500, '2025-12-10 20:31:21', 2, 14, 12, 'tam zamanlı', NULL),
(3, 'Mehmet', 'Demir', '05320000003', 17000, '2025-12-10 20:31:21', 5, 14, 14, 'tam zamanlı', NULL),
(4, 'Mert', 'Küçük', '05541690166', 155, '2025-12-14 20:11:40', 4, 14, 13, 'tam zamanlı', NULL);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `employee_leaves`
--

DROP TABLE IF EXISTS `employee_leaves`;
CREATE TABLE IF NOT EXISTS `employee_leaves` (
  `id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int NOT NULL,
  `leave_type` tinyint NOT NULL COMMENT '1=yıllık izin,2=mazeret,3=rapor',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `note` text,
  PRIMARY KEY (`id`),
  KEY `fk_leave_employee` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `employee_leaves`
--

INSERT INTO `employee_leaves` (`id`, `emp_id`, `start_date`, `end_date`, `total_days`, `leave_type`, `created_at`, `note`) VALUES
(1, 4, '2025-12-15', '2025-12-15', 1, 1, '2025-12-16 01:10:34', NULL),
(2, 1, '2025-12-16', '2025-12-16', 1, 1, '2025-12-16 01:16:59', 'Test izin'),
(3, 2, '2025-12-15', '2025-12-15', 1, 1, '2025-12-16 01:18:43', NULL),
(4, 2, '2025-12-16', '2025-12-16', 1, 1, '2025-12-16 01:22:08', 'Test izin 2'),
(5, 1, '2025-12-16', '2025-12-16', 1, 1, '2025-12-16 01:22:46', 'Test izin 3'),
(6, 1, '2025-12-19', '2025-12-19', 1, 1, '2025-12-16 01:23:29', NULL);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `employee_shifts`
--

DROP TABLE IF EXISTS `employee_shifts`;
CREATE TABLE IF NOT EXISTS `employee_shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `shift_date` date NOT NULL,
  `shift_template_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employee_day` (`employee_id`,`shift_date`),
  KEY `fk_emp_shift_template` (`shift_template_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `employee_shifts`
--

INSERT INTO `employee_shifts` (`id`, `employee_id`, `shift_date`, `shift_template_id`, `created_at`) VALUES
(1, 4, '2025-12-15', 1, '2025-12-18 12:51:56'),
(2, 4, '2025-12-16', 3, '2025-12-18 12:52:00'),
(3, 4, '2025-12-17', 3, '2025-12-18 12:52:03'),
(4, 4, '2025-12-18', 1, '2025-12-18 12:52:07'),
(5, 4, '2025-12-19', 3, '2025-12-18 12:52:13'),
(6, 4, '2025-12-20', 3, '2025-12-18 12:52:17'),
(7, 4, '2025-12-21', 5, '2025-12-18 12:52:20'),
(8, 3, '2025-12-18', 2, '2025-12-18 12:53:09'),
(9, 2, '2025-12-18', 2, '2025-12-18 12:53:53'),
(10, 1, '2025-12-18', 2, '2025-12-18 12:59:36'),
(11, 4, '2025-12-26', 5, '2025-12-18 13:23:43'),
(12, 1, '2025-12-15', 3, '2025-12-18 16:33:08'),
(13, 1, '2025-12-16', 3, '2025-12-18 16:33:10'),
(14, 1, '2025-12-17', 3, '2025-12-18 16:33:13'),
(15, 1, '2025-12-19', 3, '2025-12-18 16:33:15'),
(16, 1, '2025-12-20', 3, '2025-12-18 16:33:17'),
(17, 1, '2025-12-01', 3, '2025-12-18 16:33:26'),
(18, 1, '2025-12-02', 3, '2025-12-18 16:33:28'),
(19, 1, '2025-12-03', 3, '2025-12-18 16:33:30'),
(20, 1, '2025-12-04', 3, '2025-12-18 16:33:32'),
(21, 1, '2025-12-05', 3, '2025-12-18 16:33:34'),
(22, 1, '2025-12-06', 3, '2025-12-18 16:33:36'),
(23, 1, '2025-12-08', 3, '2025-12-18 16:33:39'),
(24, 1, '2025-12-09', 3, '2025-12-18 16:33:41'),
(25, 1, '2025-12-10', 3, '2025-12-18 16:33:43'),
(26, 1, '2025-12-11', 3, '2025-12-18 16:33:46'),
(27, 1, '2025-12-12', 3, '2025-12-18 16:33:48'),
(28, 1, '2025-12-13', 3, '2025-12-18 16:33:51'),
(29, 1, '2025-12-22', 3, '2025-12-18 16:34:00'),
(30, 1, '2025-12-23', 3, '2025-12-18 16:34:02'),
(31, 1, '2025-12-24', 3, '2025-12-18 16:34:04'),
(32, 1, '2025-12-25', 3, '2025-12-18 16:34:06'),
(33, 1, '2025-12-26', 3, '2025-12-18 16:34:08'),
(34, 1, '2025-12-29', 3, '2025-12-18 16:34:16'),
(35, 1, '2025-12-30', 3, '2025-12-18 16:34:18'),
(36, 1, '2025-12-31', 3, '2025-12-18 16:34:20'),
(37, 1, '2026-01-01', 3, '2025-12-18 16:34:22'),
(38, 1, '2026-01-02', 3, '2025-12-18 16:34:24'),
(39, 1, '2026-01-03', 3, '2025-12-18 16:34:26'),
(40, 1, '2025-12-27', 3, '2025-12-18 16:34:30'),
(41, 2, '2025-12-15', 3, '2025-12-18 19:41:12');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `employe_logs`
--

DROP TABLE IF EXISTS `employe_logs`;
CREATE TABLE IF NOT EXISTS `employe_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `type` tinyint NOT NULL COMMENT '1=in, 2=out',
  `log_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `emp_id` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `employe_logs`
--

INSERT INTO `employe_logs` (`id`, `emp_id`, `type`, `log_time`) VALUES
(21, 1, 1, '2025-12-13 02:41:45'),
(22, 1, 2, '2025-12-13 02:41:56'),
(23, 1, 1, '2025-12-13 02:42:02'),
(24, 2, 1, '2025-12-13 02:44:14'),
(25, 1, 2, '2025-12-13 20:00:00'),
(26, 2, 2, '2025-12-13 23:59:59'),
(27, 1, 1, '2025-12-14 23:10:33'),
(28, 1, 2, '2025-12-14 23:10:41'),
(29, 1, 1, '2025-12-14 23:10:48'),
(30, 1, 2, '2025-12-14 04:11:00'),
(31, 1, 2, '2025-12-14 23:55:07'),
(32, 1, 1, '2025-12-15 20:00:00'),
(33, 1, 2, '2025-12-15 23:59:59'),
(34, 4, 1, '2025-12-18 15:52:37'),
(35, 4, 2, '2025-12-18 15:52:54'),
(36, 3, 1, '2025-12-18 07:53:00'),
(37, 3, 2, '2025-12-18 15:53:32'),
(38, 2, 1, '2025-12-18 15:54:00'),
(39, 1, 1, '2025-12-18 15:59:40'),
(40, 1, 2, '2025-12-18 15:59:54');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `expense`
--

DROP TABLE IF EXISTS `expense`;
CREATE TABLE IF NOT EXISTS `expense` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_type` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` double NOT NULL DEFAULT '0',
  `date` date NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_type` (`expense_type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `expense`
--

INSERT INTO `expense` (`id`, `expense_type`, `name`, `price`, `date`, `description`) VALUES
(1, 1, 'Kasım Elektrik Faturası', 3200, '2025-11-30', 'Elektrik faturası'),
(2, 2, 'Bulaşık Deterjanı', 150, '2025-12-05', 'Temizlik malzemesi'),
(3, 4, 'Ahmet Yılmaz Maaş Ödemesi', 1655.27, '2025-12-14', 'Maaş ödemesi'),
(4, 8, 'Aralık ayı dükkan kirası', 30000, '2025-12-18', 'Dükkan kira'),
(5, 3, 'Lavabo Tamiri', 1500, '2025-12-18', 'Lavabo yapıldı');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `expense_types`
--

DROP TABLE IF EXISTS `expense_types`;
CREATE TABLE IF NOT EXISTS `expense_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `expense_types`
--

INSERT INTO `expense_types` (`id`, `type_name`) VALUES
(9, 'Diğer'),
(7, 'Doğalgaz'),
(1, 'Elektrik'),
(8, 'Kira'),
(4, 'Maaş'),
(6, 'Su'),
(3, 'Tamir'),
(2, 'Temizlik');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `ingredient`
--

DROP TABLE IF EXISTS `ingredient`;
CREATE TABLE IF NOT EXISTS `ingredient` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wholesaler_id` int DEFAULT NULL,
  `min_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unit_price` decimal(10,2) NOT NULL,
  `min_purch` decimal(10,2) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `wholesaler_id` (`wholesaler_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `ingredient`
--

INSERT INTO `ingredient` (`id`, `name`, `stock`, `unit`, `wholesaler_id`, `min_stock`, `unit_price`, `min_purch`, `updated_at`) VALUES
(1, 'Kahve Çekirdeği', 24.97, 'kg', 2, 5.00, 650.00, 1.00, '2025-12-18 23:16:43'),
(2, 'Süt', 40.00, 'lt', 1, 10.00, 27.00, 3.00, '2025-12-18 23:15:04'),
(3, 'Şeker', 6.47, 'kg', 1, 3.00, 22.50, 1.50, '2025-12-18 23:16:43'),
(4, 'Süt Tozu', 2.00, 'kg', 2, 1.00, 35.00, 1.00, '2025-12-18 23:15:04'),
(6, 'Espresso', 1.46, 'kg', 2, 0.50, 650.00, 1.00, '2025-12-18 23:15:04'),
(7, 'Karton Bardak', 100.00, 'adet', 4, 75.00, 0.15, 100.00, '2025-12-18 23:15:04'),
(8, 'Bal', 1.00, 'kg', 1, 0.25, 440.00, 1.00, '2025-12-18 23:15:04'),
(9, 'Badem Sütü', 2.00, 'L', 1, 1.00, 110.00, 1.50, '2025-12-18 23:15:04'),
(10, 'Toz Çay', 0.99, 'kg', 1, 0.50, 200.00, 2.00, '2025-12-18 23:15:04'),
(11, 'Filtre Kahve', 2.00, 'kg', 2, 1.00, 1200.00, 2.00, '2025-12-18 23:15:04'),
(12, 'Çikolata Sosu', 1.00, 'L', 1, 0.75, 280.00, 1.00, '2025-12-18 23:15:04'),
(13, 'Krema', 1.00, 'L', 1, 0.50, 180.00, 1.00, '2025-12-18 23:15:04');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `payroll_settings`
--

DROP TABLE IF EXISTS `payroll_settings`;
CREATE TABLE IF NOT EXISTS `payroll_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(6,3) NOT NULL,
  `value_string` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value_type` enum('RATE','MULTIPLIER','AMOUNT','STRING','BOOLEAN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `payroll_settings`
--

INSERT INTO `payroll_settings` (`id`, `code`, `name`, `value`, `value_string`, `value_type`, `description`, `active`, `created_at`) VALUES
(1, 'SGK_EMPLOYEE_RATE', 'SGK İşçi Primi', 14.000, NULL, 'RATE', 'Çalışan payı %14', 1, '2025-12-17 21:00:29'),
(2, 'SGK_EMPLOYER_RATE', 'SGK İşveren Primi', 0.205, NULL, 'RATE', 'İşveren payı %20.5', 1, '2025-12-17 21:00:29'),
(3, 'OVERTIME_MULTIPLIER', 'Fazla Mesai Çarpanı', 2.000, NULL, 'MULTIPLIER', 'Mesai saat ücreti x1.5', 1, '2025-12-17 21:00:29'),
(4, 'WEEKEND_MULTIPLIER', 'Hafta Sonu Çarpanı', 2.000, NULL, 'MULTIPLIER', 'Pazar günü mesai x2', 1, '2025-12-17 21:00:29'),
(5, 'DAILY_MEAL_ALLOWANCE', 'Günlük Yemek Ücreti', 187.000, NULL, 'AMOUNT', 'Günlük yemek bedeli', 1, '2025-12-17 21:00:29'),
(6, 'KDV_FOOD', 'KDV Oranı - Yiyecek', 10.000, NULL, 'RATE', 'Hazır gıda ürünleri için KDV', 1, '2025-12-18 14:52:22'),
(7, 'KDV_DRINK', 'KDV Oranı - İçecek', 20.000, NULL, 'RATE', 'İçecekler için KDV', 1, '2025-12-18 14:52:22'),
(8, 'CURRENCY_DEFAULT', 'Varsayılan Para Birimi', 0.000, 'TRY', 'STRING', 'Sistem para birimi', 1, '2025-12-18 14:52:22'),
(9, 'STOCK_WARNING', 'Stok Kritik Seviye Uyarısı', 1.000, NULL, 'BOOLEAN', 'Düşük stokta uyarı ver', 1, '2025-12-18 14:52:22'),
(10, 'AUTO_CASH_CLOSE', 'Otomatik Kasa Kapanışı', 0.000, NULL, 'BOOLEAN', 'Gün sonunda otomatik kapanış', 1, '2025-12-18 14:52:22');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `payroll_setting_history`
--

DROP TABLE IF EXISTS `payroll_setting_history`;
CREATE TABLE IF NOT EXISTS `payroll_setting_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(10,2) DEFAULT NULL,
  `value_string` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effective_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code_date` (`code`,`effective_date`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `payroll_setting_history`
--

INSERT INTO `payroll_setting_history` (`id`, `code`, `value`, `value_string`, `effective_date`, `created_at`) VALUES
(1, 'SGK_EMPLOYEE_RATE', 0.14, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(2, 'SGK_EMPLOYER_RATE', 0.21, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(3, 'OVERTIME_MULTIPLIER', 1.60, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(4, 'WEEKEND_MULTIPLIER', 2.00, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(5, 'DAILY_MEAL_ALLOWANCE', 187.00, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(6, 'KDV_FOOD', 10.00, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(7, 'KDV_DRINK', 20.00, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(8, 'CURRENCY_DEFAULT', 0.00, 'TRY', '2023-01-01', '2025-12-18 17:09:08'),
(9, 'STOCK_WARNING', 1.00, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(10, 'AUTO_CASH_CLOSE', 0.00, NULL, '2023-01-01', '2025-12-18 17:09:08'),
(11, '\0SGK_EMPLOY', 0.00, NULL, '2025-12-18', '2025-12-18 18:05:39'),
(12, 'SGK_EMPLOYEE_RATE', 14.00, NULL, '2025-12-18', '2025-12-18 18:05:39'),
(13, '\0OVERTIME_M', 99999999.99, NULL, '2025-12-18', '2025-12-18 18:05:39'),
(14, 'OVERTIME_MULTIPLIER', 1.60, NULL, '2025-12-18', '2025-12-18 18:05:39'),
(15, '\0SGK_EMPLOY', 0.00, NULL, '2025-12-18', '2025-12-18 19:46:16'),
(16, 'SGK_EMPLOYEE_RATE', 14.00, NULL, '2025-12-18', '2025-12-18 19:46:16'),
(17, '\0OVERTIME_M', 99999999.99, NULL, '2025-12-18', '2025-12-18 19:46:16'),
(18, 'OVERTIME_MULTIPLIER', 2.00, NULL, '2025-12-18', '2025-12-18 19:46:16');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `positions`
--

DROP TABLE IF EXISTS `positions`;
CREATE TABLE IF NOT EXISTS `positions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `posit_name` varchar(75) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `positions`
--

INSERT INTO `positions` (`id`, `posit_name`) VALUES
(1, 'Kasiyer'),
(2, 'Barista'),
(3, 'Temizlik Personeli'),
(4, 'Müdür'),
(5, 'Kurye');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `product`
--

DROP TABLE IF EXISTS `product`;
CREATE TABLE IF NOT EXISTS `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_type` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `image` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `process_type` enum('üretilen','al-sat') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_type_fk` (`product_type`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `product`
--

INSERT INTO `product` (`id`, `name`, `product_type`, `price`, `image`, `process_type`) VALUES
(4, 'Latte', 1, 70.00, '/uploads/products/latte.jpg', 'üretilen'),
(5, 'Americano', 1, 75.00, '/uploads/products/americano.jpg', 'üretilen'),
(6, 'Mocha', 1, 90.00, '/uploads/products/mocha.jpg', 'üretilen'),
(7, 'Sandviç', 2, 85.00, '/uploads/products/sandvic.jpg', 'al-sat'),
(8, 'Cheesecake', 3, 95.00, '/uploads/products/cheesecake.jpg', 'al-sat'),
(10, 'Türk Kahvesi', 1, 75.00, '/uploads/product/turk-kahvesi.jpg', 'üretilen'),
(11, 'Cookie', 3, 50.00, '/uploads/product/cookie.jpeg', 'al-sat'),
(12, 'Çay', 1, 20.00, '/uploads/product/cay.jpg', 'üretilen'),
(13, 'Su 500 ml', 1, 15.00, '/uploads/product/su-500-ml.jpg', 'al-sat'),
(14, 'Cappuccino', 1, 120.00, '/uploads/product/cappuccino.jpeg', 'üretilen'),
(15, 'Magnolya', 3, 200.00, '/uploads/product/magnolya.jpg', 'al-sat');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `product_stock`
--

DROP TABLE IF EXISTS `product_stock`;
CREATE TABLE IF NOT EXISTS `product_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `min_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `wholesaler_id` int DEFAULT NULL,
  `unit_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `min_purch` decimal(10,2) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_productstock_product` (`product_id`),
  KEY `fk_productstock_wholesaler` (`wholesaler_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `product_stock`
--

INSERT INTO `product_stock` (`id`, `product_id`, `stock`, `min_stock`, `wholesaler_id`, `unit_price`, `min_purch`, `updated_at`) VALUES
(1, 7, 8.00, 5.00, 1, 35.00, 10.00, '2025-12-18 23:16:43'),
(2, 8, 17.00, 5.00, 1, 52.00, 15.00, '2025-12-18 23:15:04'),
(3, 11, 11.00, 10.00, 1, 25.00, 15.00, '2025-12-18 23:15:04'),
(4, 13, 14.00, 25.00, 1, 3.00, 25.00, '2025-12-18 23:16:43'),
(5, 15, 9.00, 5.00, 1, 90.00, 10.00, '2025-12-18 23:16:43');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `product_types`
--

DROP TABLE IF EXISTS `product_types`;
CREATE TABLE IF NOT EXISTS `product_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_name` (`type_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `product_types`
--

INSERT INTO `product_types` (`id`, `type_name`) VALUES
(1, 'İçecek'),
(3, 'Tatlı'),
(2, 'Yiyecek');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `wholesaler_id` int NOT NULL,
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expected_date` date DEFAULT NULL,
  `status` tinyint NOT NULL COMMENT '0=taslak,1=sipariş verildi,2=sevkiyatta,3=teslim alındı,4=iptal',
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `note` text,
  PRIMARY KEY (`id`),
  KEY `fk_po_wholesaler` (`wholesaler_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `wholesaler_id`, `order_date`, `expected_date`, `status`, `total_amount`, `note`) VALUES
(1, 1, '2025-12-15 18:37:21', NULL, 3, 813.75, NULL),
(2, 1, '2025-12-15 20:14:23', NULL, 3, 78.75, NULL),
(3, 1, '2025-12-15 20:19:16', NULL, 3, 350.00, NULL),
(4, 1, '2025-12-18 22:40:00', NULL, 3, 375.00, NULL),
(5, 1, '2025-12-19 02:11:31', NULL, 1, 75.00, NULL);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int NOT NULL,
  `item_type` tinyint NOT NULL COMMENT '1=ingredient, 2=al-sat ürün',
  `item_id` int NOT NULL COMMENT 'ingredient.id veya product.id',
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_poi_order` (`purchase_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `purchase_order_items`
--

INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `item_type`, `item_id`, `quantity`, `unit_price`, `total_price`) VALUES
(1, 1, 1, 3, 1.50, 22.50, 33.75),
(2, 1, 2, 8, 15.00, 52.00, 780.00),
(3, 2, 1, 3, 3.50, 22.50, 78.75),
(4, 3, 2, 7, 10.00, 35.00, 350.00),
(5, 4, 2, 11, 15.00, 25.00, 375.00),
(6, 5, 2, 13, 25.00, 3.00, 75.00);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `receipt`
--

DROP TABLE IF EXISTS `receipt`;
CREATE TABLE IF NOT EXISTS `receipt` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `ingredient_id` int NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `ingredient_id` (`ingredient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `receipt`
--

INSERT INTO `receipt` (`id`, `product_id`, `ingredient_id`, `quantity`) VALUES
(10, 10, 1, 0.010),
(11, 10, 3, 0.010),
(13, 12, 10, 0.002),
(14, 4, 6, 0.018),
(15, 4, 2, 0.200),
(16, 14, 6, 0.018),
(17, 14, 2, 0.160),
(19, 5, 6, 0.018),
(20, 6, 6, 0.010),
(21, 6, 2, 0.200),
(22, 6, 12, 0.020),
(23, 6, 13, 0.010);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `salary`
--

DROP TABLE IF EXISTS `salary`;
CREATE TABLE IF NOT EXISTS `salary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `base_salary` double NOT NULL,
  `bonus` double DEFAULT '0',
  `deductions` double DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `emp_id` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `salary`
--

INSERT INTO `salary` (`id`, `emp_id`, `month`, `year`, `base_salary`, `bonus`, `deductions`, `created_at`) VALUES
(1, 1, 12, 2025, 18000, 500, 0, '2025-12-10 20:31:21'),
(2, 2, 12, 2025, 19500, 0, 500, '2025-12-10 20:31:21');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `salary_payments`
--

DROP TABLE IF EXISTS `salary_payments`;
CREATE TABLE IF NOT EXISTS `salary_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `emp_id` int NOT NULL,
  `amount` double NOT NULL,
  `payment_date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `emp_id` (`emp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `salary_payments`
--

INSERT INTO `salary_payments` (`id`, `emp_id`, `amount`, `payment_date`) VALUES
(3, 1, 1655.27, '2025-12-14');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `sales`
--

DROP TABLE IF EXISTS `sales`;
CREATE TABLE IF NOT EXISTS `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `total_price` decimal(10,2) NOT NULL,
  `income` decimal(10,3) NOT NULL DEFAULT '0.000',
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_type` enum('Nakit','Kart') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sales_type` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `sales_type` (`sales_type`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `sales`
--

INSERT INTO `sales` (`id`, `product_id`, `quantity`, `total_price`, `income`, `date`, `payment_type`, `sales_type`) VALUES
(7, 4, 2, 140.00, 30.500, '2025-12-10 14:10:00', 'Nakit', 1),
(8, 5, 1, 55.00, 12.300, '2025-12-10 15:22:00', 'Nakit', 1),
(9, 6, 1, 80.00, 19.400, '2025-12-10 16:05:00', 'Nakit', 1),
(13, 7, 1, 85.00, 25.500, '2025-12-14 03:10:55', 'Nakit', 1),
(14, 8, 1, 95.00, 28.500, '2025-12-14 03:10:55', 'Nakit', 1),
(15, 5, 1, 55.00, 16.500, '2025-12-14 03:10:55', 'Nakit', 1),
(16, 8, 1, 95.00, 43.000, '2025-12-14 23:07:10', 'Kart', 1),
(17, 4, 1, 70.00, 70.000, '2025-12-14 23:07:10', 'Kart', 1),
(18, 7, 1, 85.00, 50.000, '2025-12-14 23:07:10', 'Kart', 1),
(19, 7, 1, 85.00, 50.000, '2025-12-14 23:41:48', 'Kart', 1),
(20, 7, 1, 85.00, 50.000, '2025-12-15 20:18:57', 'Kart', 1),
(21, 5, 1, 55.00, 52.150, '2025-12-15 20:18:57', 'Kart', 1),
(22, 11, 1, 50.00, 25.000, '2025-12-17 19:26:59', 'Kart', 1),
(23, 4, 1, 70.00, 70.000, '2025-12-17 19:26:59', 'Kart', 1),
(24, 11, 1, 50.00, 25.000, '2025-12-17 19:32:02', 'Kart', 2),
(25, 10, 1, 75.00, 71.275, '2025-12-17 19:32:02', 'Kart', 2),
(26, 7, 1, 85.00, 50.000, '2025-12-17 19:32:28', 'Nakit', 1),
(27, 5, 1, 55.00, 52.150, '2025-12-17 19:32:28', 'Nakit', 1),
(28, 4, 1, 70.00, 70.000, '2025-12-17 19:32:28', 'Nakit', 1),
(29, 11, 3, 150.00, 75.000, '2025-12-18 22:50:31', 'Kart', 1),
(30, 12, 3, 60.00, 58.800, '2025-12-18 22:50:31', 'Kart', 1),
(31, 8, 2, 190.00, 86.000, '2025-12-18 22:51:03', 'Kart', 1),
(32, 5, 2, 110.00, 97.000, '2025-12-18 22:51:03', 'Kart', 1),
(33, 11, 3, 150.00, 75.000, '2025-12-18 22:51:06', 'Kart', 1),
(34, 11, 1, 50.00, 25.000, '2025-12-18 23:03:06', 'Nakit', 1),
(35, 8, 1, 95.00, 43.000, '2025-12-18 23:03:06', 'Nakit', 1),
(36, 13, 1, 15.00, 12.000, '2025-12-19 02:16:43', 'Kart', 1),
(37, 7, 1, 85.00, 50.000, '2025-12-19 02:16:43', 'Kart', 1),
(38, 15, 1, 200.00, 110.000, '2025-12-19 02:16:43', 'Kart', 1),
(39, 10, 2, 150.00, 136.550, '2025-12-19 02:16:43', 'Kart', 1);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `sales_type`
--

DROP TABLE IF EXISTS `sales_type`;
CREATE TABLE IF NOT EXISTS `sales_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sales_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `sales_type`
--

INSERT INTO `sales_type` (`id`, `sales_name`) VALUES
(1, 'Gel al'),
(2, 'Kurye');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `shift_templates`
--

DROP TABLE IF EXISTS `shift_templates`;
CREATE TABLE IF NOT EXISTS `shift_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_minutes` int DEFAULT '60',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `shift_templates`
--

INSERT INTO `shift_templates` (`id`, `name`, `start_time`, `end_time`, `break_minutes`) VALUES
(1, 'Sabah', '08:00:00', '16:00:00', 60),
(2, 'Akşam', '16:00:00', '00:00:00', 60),
(3, 'Full', '09:00:00', '18:00:00', 60),
(4, 'Part-Time', '12:00:00', '16:00:00', 60),
(5, 'Hafta Sonu', '10:00:00', '18:00:00', 60);

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `wholesaler`
--

DROP TABLE IF EXISTS `wholesaler`;
CREATE TABLE IF NOT EXISTS `wholesaler` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `wholesaler`
--

INSERT INTO `wholesaler` (`id`, `name`, `phone`, `address`, `active`) VALUES
(1, '35 Gıda Toptan AŞ', '02120000001', 'İzmir', 1),
(2, 'Kahve Market', '02120000002', 'İzmir', 1),
(4, 'Ahmet Ambalaj', '02124444444', 'Buca İzmir', 1);

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `employe`
--
ALTER TABLE `employe`
  ADD CONSTRAINT `employe_ibfk_1` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`),
  ADD CONSTRAINT `fk_employe_shift_template` FOREIGN KEY (`shift_id`) REFERENCES `shift_templates` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `employee_leaves`
--
ALTER TABLE `employee_leaves`
  ADD CONSTRAINT `fk_leave_employee` FOREIGN KEY (`emp_id`) REFERENCES `employe` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `employee_shifts`
--
ALTER TABLE `employee_shifts`
  ADD CONSTRAINT `fk_emp_shift_employee` FOREIGN KEY (`employee_id`) REFERENCES `employe` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_emp_shift_template` FOREIGN KEY (`shift_template_id`) REFERENCES `shift_templates` (`id`) ON DELETE SET NULL;

--
-- Tablo kısıtlamaları `employe_logs`
--
ALTER TABLE `employe_logs`
  ADD CONSTRAINT `employe_logs_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employe` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `expense`
--
ALTER TABLE `expense`
  ADD CONSTRAINT `expense_ibfk_1` FOREIGN KEY (`expense_type`) REFERENCES `expense_types` (`id`);

--
-- Tablo kısıtlamaları `ingredient`
--
ALTER TABLE `ingredient`
  ADD CONSTRAINT `ingredient_ibfk_1` FOREIGN KEY (`wholesaler_id`) REFERENCES `wholesaler` (`id`);

--
-- Tablo kısıtlamaları `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `product_type_fk` FOREIGN KEY (`product_type`) REFERENCES `product_types` (`id`);

--
-- Tablo kısıtlamaları `product_stock`
--
ALTER TABLE `product_stock`
  ADD CONSTRAINT `fk_productstock_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_productstock_wholesaler` FOREIGN KEY (`wholesaler_id`) REFERENCES `wholesaler` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `fk_po_wholesaler` FOREIGN KEY (`wholesaler_id`) REFERENCES `wholesaler` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `fk_poi_order` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `receipt`
--
ALTER TABLE `receipt`
  ADD CONSTRAINT `receipt_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `receipt_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredient` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `salary`
--
ALTER TABLE `salary`
  ADD CONSTRAINT `salary_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employe` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `salary_payments`
--
ALTER TABLE `salary_payments`
  ADD CONSTRAINT `salary_payments_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employe` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`sales_type`) REFERENCES `sales_type` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
