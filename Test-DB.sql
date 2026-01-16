-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 15, 2026 at 10:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `laravel`
--

-- --------------------------------------------------------

--
-- Table structure for table `branchables`
--

CREATE TABLE `branchables` (
  `branch_id` char(36) NOT NULL,
  `branchable_id` char(36) NOT NULL,
  `branchable_type` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `branch_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `manager_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` char(36) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `children_universities`
--

CREATE TABLE `children_universities` (
  `id` char(36) NOT NULL,
  `code` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `class_name` varchar(255) DEFAULT NULL,
  `level_id` char(36) DEFAULT NULL,
  `user_id` char(36) NOT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `child_level_subscriptions`
--

CREATE TABLE `child_level_subscriptions` (
  `subscription_id` char(36) NOT NULL,
  `child_id` char(36) NOT NULL,
  `level_id` char(36) NOT NULL,
  `subscribe_date` timestamp NULL DEFAULT NULL,
  `expiry_date` timestamp NULL DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `class_id` char(36) NOT NULL,
  `class_name` varchar(255) NOT NULL,
  `branch_id` char(36) DEFAULT NULL,
  `level_id` char(36) DEFAULT NULL,
  `course_id` char(36) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_moderators`
--

CREATE TABLE `class_moderators` (
  `class_moderator_id` char(36) NOT NULL,
  `class_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role_in_class` enum('main_teacher','assistant','attendance_manager','content_manager') NOT NULL DEFAULT 'assistant',
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `class_students`
--

CREATE TABLE `class_students` (
  `class_id` char(36) NOT NULL,
  `child_id` char(36) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `course_id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `instructor_id` char(36) NOT NULL,
  `category_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_details`
--

CREATE TABLE `course_details` (
  `detail_id` char(36) NOT NULL,
  `objectives` text DEFAULT NULL,
  `prerequisites` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `total_duration` int(11) DEFAULT NULL,
  `language` varchar(50) NOT NULL DEFAULT 'ar',
  `level` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'available' COMMENT 'available, upcoming, suspended',
  `course_id` char(36) NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_enrollments`
--

CREATE TABLE `course_enrollments` (
  `enrollment_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `max_students` int(11) NOT NULL DEFAULT 0,
  `current_students` int(11) NOT NULL DEFAULT 0,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `is_processing_enrollment` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_level`
--

CREATE TABLE `course_level` (
  `level_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_moderators`
--

CREATE TABLE `course_moderators` (
  `course_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_pricings`
--

CREATE TABLE `course_pricings` (
  `pricing_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `discount_start` timestamp NULL DEFAULT NULL,
  `discount_end` timestamp NULL DEFAULT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_purchases`
--

CREATE TABLE `course_purchases` (
  `purchase_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `child_id` char(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(255) NOT NULL DEFAULT 'EGP',
  `payment_status` varchar(255) NOT NULL,
  `payment_method` varchar(255) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `payment_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payment_response`)),
  `purchased_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `instructor_profiles`
--

CREATE TABLE `instructor_profiles` (
  `instructor_profile_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `bio` text DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `experience` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `github_url` varchar(255) DEFAULT NULL,
  `website_url` varchar(255) DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `facebook_url` varchar(255) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `public_email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lectures`
--

CREATE TABLE `lectures` (
  `lecture_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `instructor_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `lecture_type` enum('video','text','pdf','presentation','quiz','assignment','interactive','audio') NOT NULL DEFAULT 'pdf',
  `duration` int(11) DEFAULT NULL COMMENT 'Duration in minutes',
  `order_in_course` int(11) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `is_free` tinyint(1) NOT NULL DEFAULT 1,
  `video_url` varchar(500) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `external_url` varchar(500) DEFAULT NULL,
  `lecture_number` int(11) NOT NULL DEFAULT 0,
  `prerequisites` text DEFAULT NULL,
  `learning_objectives` text DEFAULT NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `estimated_time` int(11) DEFAULT NULL COMMENT 'Estimated time in minutes',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lecture_attachments`
--

CREATE TABLE `lecture_attachments` (
  `attachment_id` char(36) NOT NULL,
  `lecture_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` bigint(20) NOT NULL DEFAULT 0,
  `download_count` int(11) NOT NULL DEFAULT 0,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lecture_comments`
--

CREATE TABLE `lecture_comments` (
  `comment_id` char(36) NOT NULL,
  `lecture_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `parent_comment_id` char(36) DEFAULT NULL,
  `content` text NOT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `is_instructor_comment` tinyint(1) NOT NULL DEFAULT 0,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `is_resolved` tinyint(1) NOT NULL DEFAULT 0,
  `rating` int(11) DEFAULT NULL COMMENT '1-5 rating',
  `helpful_votes` int(11) NOT NULL DEFAULT 0,
  `reported_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lecture_resources`
--

CREATE TABLE `lecture_resources` (
  `resource_id` char(36) NOT NULL,
  `lecture_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `url` varchar(500) NOT NULL,
  `resource_type` enum('article','video','book','tool','website','document','presentation','quiz','assignment','forum','chat') NOT NULL DEFAULT 'website',
  `is_external` tinyint(1) NOT NULL DEFAULT 1,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `levels`
--

CREATE TABLE `levels` (
  `level_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `subscription_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `start_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_date` timestamp NULL DEFAULT NULL,
  `type` enum('unlimited','limited') NOT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_course_progress`
--

CREATE TABLE `user_course_progress` (
  `user_course_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `completion_percentage` double NOT NULL DEFAULT 0,
  `last_accessed` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_lecture_progress`
--

CREATE TABLE `user_lecture_progress` (
  `progress_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `lecture_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `completion_percentage` int(11) NOT NULL DEFAULT 0,
  `time_spent` int(11) NOT NULL DEFAULT 0 COMMENT 'Time spent in minutes',
  `last_accessed` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `rating` int(11) DEFAULT NULL COMMENT '1-5 rating',
  `feedback` text DEFAULT NULL,
  `is_bookmarked` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_video_progress`
--

CREATE TABLE `user_video_progress` (
  `progress_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `video_id` char(36) NOT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `last_watched_time` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `videos`
--

CREATE TABLE `videos` (
  `video_id` char(36) NOT NULL,
  `course_id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `order_in_course` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `branchables`
--
ALTER TABLE `branchables`
  ADD KEY `branchables_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`branch_id`),
  ADD KEY `branches_manager_id_foreign` (`manager_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `children_universities`
--
ALTER TABLE `children_universities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `children_universities_code_unique` (`code`),
  ADD KEY `children_universities_user_id_foreign` (`user_id`),
  ADD KEY `children_universities_level_id_foreign` (`level_id`);

--
-- Indexes for table `child_level_subscriptions`
--
ALTER TABLE `child_level_subscriptions`
  ADD PRIMARY KEY (`subscription_id`),
  ADD KEY `child_level_subscriptions_child_id_foreign` (`child_id`),
  ADD KEY `child_level_subscriptions_level_id_foreign` (`level_id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`),
  ADD KEY `classes_branch_id_foreign` (`branch_id`),
  ADD KEY `classes_level_id_foreign` (`level_id`),
  ADD KEY `classes_course_id_foreign` (`course_id`),
  ADD KEY `classes_created_by_foreign` (`created_by`);

--
-- Indexes for table `class_moderators`
--
ALTER TABLE `class_moderators`
  ADD PRIMARY KEY (`class_moderator_id`),
  ADD UNIQUE KEY `class_moderators_class_id_user_id_unique` (`class_id`,`user_id`),
  ADD KEY `class_moderators_user_id_foreign` (`user_id`);

--
-- Indexes for table `class_students`
--
ALTER TABLE `class_students`
  ADD PRIMARY KEY (`class_id`,`child_id`),
  ADD KEY `class_students_child_id_foreign` (`child_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`course_id`),
  ADD KEY `courses_instructor_id_foreign` (`instructor_id`),
  ADD KEY `courses_category_id_foreign` (`category_id`);

--
-- Indexes for table `course_details`
--
ALTER TABLE `course_details`
  ADD PRIMARY KEY (`detail_id`),
  ADD KEY `course_details_course_id_foreign` (`course_id`);

--
-- Indexes for table `course_enrollments`
--
ALTER TABLE `course_enrollments`
  ADD PRIMARY KEY (`enrollment_id`),
  ADD KEY `course_enrollments_course_id_foreign` (`course_id`),
  ADD KEY `course_enrollments_user_id_foreign` (`user_id`);

--
-- Indexes for table `course_level`
--
ALTER TABLE `course_level`
  ADD PRIMARY KEY (`level_id`,`course_id`),
  ADD KEY `course_level_course_id_foreign` (`course_id`);

--
-- Indexes for table `course_moderators`
--
ALTER TABLE `course_moderators`
  ADD PRIMARY KEY (`course_id`,`user_id`),
  ADD KEY `course_moderators_user_id_foreign` (`user_id`);

--
-- Indexes for table `course_pricings`
--
ALTER TABLE `course_pricings`
  ADD PRIMARY KEY (`pricing_id`),
  ADD KEY `course_pricings_course_id_foreign` (`course_id`);

--
-- Indexes for table `course_purchases`
--
ALTER TABLE `course_purchases`
  ADD PRIMARY KEY (`purchase_id`),
  ADD KEY `course_purchases_user_id_foreign` (`user_id`),
  ADD KEY `course_purchases_course_id_foreign` (`course_id`),
  ADD KEY `course_purchases_child_id_foreign` (`child_id`);

--
-- Indexes for table `instructor_profiles`
--
ALTER TABLE `instructor_profiles`
  ADD PRIMARY KEY (`instructor_profile_id`),
  ADD KEY `instructor_profiles_user_id_foreign` (`user_id`);

--
-- Indexes for table `lectures`
--
ALTER TABLE `lectures`
  ADD PRIMARY KEY (`lecture_id`),
  ADD KEY `lectures_instructor_id_foreign` (`instructor_id`),
  ADD KEY `lectures_course_id_order_in_course_index` (`course_id`,`order_in_course`),
  ADD KEY `lectures_course_id_is_published_index` (`course_id`,`is_published`),
  ADD KEY `lectures_lecture_type_is_published_index` (`lecture_type`,`is_published`),
  ADD KEY `lectures_status_index` (`status`),
  ADD KEY `lectures_difficulty_level_index` (`difficulty_level`);

--
-- Indexes for table `lecture_attachments`
--
ALTER TABLE `lecture_attachments`
  ADD PRIMARY KEY (`attachment_id`),
  ADD KEY `lecture_attachments_lecture_id_order_index_index` (`lecture_id`,`order_index`),
  ADD KEY `lecture_attachments_is_required_index` (`is_required`),
  ADD KEY `lecture_attachments_file_type_index` (`file_type`);

--
-- Indexes for table `lecture_comments`
--
ALTER TABLE `lecture_comments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `lecture_comments_user_id_foreign` (`user_id`),
  ADD KEY `lecture_comments_parent_comment_id_foreign` (`parent_comment_id`),
  ADD KEY `lecture_comments_lecture_id_parent_comment_id_index` (`lecture_id`,`parent_comment_id`),
  ADD KEY `lecture_comments_lecture_id_is_pinned_index` (`lecture_id`,`is_pinned`),
  ADD KEY `lecture_comments_lecture_id_is_instructor_comment_index` (`lecture_id`,`is_instructor_comment`),
  ADD KEY `lecture_comments_is_resolved_index` (`is_resolved`),
  ADD KEY `lecture_comments_rating_index` (`rating`),
  ADD KEY `lecture_comments_helpful_votes_index` (`helpful_votes`),
  ADD KEY `lecture_comments_reported_count_index` (`reported_count`);

--
-- Indexes for table `lecture_resources`
--
ALTER TABLE `lecture_resources`
  ADD PRIMARY KEY (`resource_id`),
  ADD KEY `lecture_resources_lecture_id_order_index_index` (`lecture_id`,`order_index`),
  ADD KEY `lecture_resources_resource_type_index` (`resource_type`),
  ADD KEY `lecture_resources_is_required_index` (`is_required`),
  ADD KEY `lecture_resources_is_external_index` (`is_external`);

--
-- Indexes for table `levels`
--
ALTER TABLE `levels`
  ADD PRIMARY KEY (`level_id`),
  ADD UNIQUE KEY `levels_name_unique` (`name`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`subscription_id`),
  ADD KEY `subscriptions_user_id_foreign` (`user_id`),
  ADD KEY `subscriptions_course_id_foreign` (`course_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `user_course_progress`
--
ALTER TABLE `user_course_progress`
  ADD PRIMARY KEY (`user_course_id`),
  ADD KEY `user_course_progress_user_id_foreign` (`user_id`),
  ADD KEY `user_course_progress_course_id_foreign` (`course_id`);

--
-- Indexes for table `user_lecture_progress`
--
ALTER TABLE `user_lecture_progress`
  ADD PRIMARY KEY (`progress_id`),
  ADD UNIQUE KEY `user_lecture_progress_user_id_lecture_id_unique` (`user_id`,`lecture_id`),
  ADD KEY `user_lecture_progress_course_id_foreign` (`course_id`),
  ADD KEY `user_lecture_progress_user_id_course_id_index` (`user_id`,`course_id`),
  ADD KEY `user_lecture_progress_lecture_id_is_completed_index` (`lecture_id`,`is_completed`),
  ADD KEY `user_lecture_progress_completion_percentage_index` (`completion_percentage`);

--
-- Indexes for table `user_video_progress`
--
ALTER TABLE `user_video_progress`
  ADD PRIMARY KEY (`progress_id`),
  ADD KEY `user_video_progress_user_id_foreign` (`user_id`),
  ADD KEY `user_video_progress_video_id_foreign` (`video_id`);

--
-- Indexes for table `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`video_id`),
  ADD KEY `videos_course_id_foreign` (`course_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `branchables`
--
ALTER TABLE `branchables`
  ADD CONSTRAINT `branchables_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `branches_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `children_universities`
--
ALTER TABLE `children_universities`
  ADD CONSTRAINT `children_universities_level_id_foreign` FOREIGN KEY (`level_id`) REFERENCES `levels` (`level_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `children_universities_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `child_level_subscriptions`
--
ALTER TABLE `child_level_subscriptions`
  ADD CONSTRAINT `child_level_subscriptions_child_id_foreign` FOREIGN KEY (`child_id`) REFERENCES `children_universities` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `child_level_subscriptions_level_id_foreign` FOREIGN KEY (`level_id`) REFERENCES `levels` (`level_id`) ON DELETE CASCADE;

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `classes_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `classes_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `classes_level_id_foreign` FOREIGN KEY (`level_id`) REFERENCES `levels` (`level_id`) ON DELETE SET NULL;

--
-- Constraints for table `class_moderators`
--
ALTER TABLE `class_moderators`
  ADD CONSTRAINT `class_moderators_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `class_moderators_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `class_students`
--
ALTER TABLE `class_students`
  ADD CONSTRAINT `class_students_child_id_foreign` FOREIGN KEY (`child_id`) REFERENCES `children_universities` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `class_students_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE;

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `courses_instructor_id_foreign` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_details`
--
ALTER TABLE `course_details`
  ADD CONSTRAINT `course_details_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_enrollments`
--
ALTER TABLE `course_enrollments`
  ADD CONSTRAINT `course_enrollments_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_enrollments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `course_level`
--
ALTER TABLE `course_level`
  ADD CONSTRAINT `course_level_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_level_level_id_foreign` FOREIGN KEY (`level_id`) REFERENCES `levels` (`level_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_moderators`
--
ALTER TABLE `course_moderators`
  ADD CONSTRAINT `course_moderators_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_moderators_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_pricings`
--
ALTER TABLE `course_pricings`
  ADD CONSTRAINT `course_pricings_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE;

--
-- Constraints for table `course_purchases`
--
ALTER TABLE `course_purchases`
  ADD CONSTRAINT `course_purchases_child_id_foreign` FOREIGN KEY (`child_id`) REFERENCES `children_universities` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `course_purchases_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `course_purchases_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `instructor_profiles`
--
ALTER TABLE `instructor_profiles`
  ADD CONSTRAINT `instructor_profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `lectures`
--
ALTER TABLE `lectures`
  ADD CONSTRAINT `lectures_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lectures_instructor_id_foreign` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `lecture_attachments`
--
ALTER TABLE `lecture_attachments`
  ADD CONSTRAINT `lecture_attachments_lecture_id_foreign` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`lecture_id`) ON DELETE CASCADE;

--
-- Constraints for table `lecture_comments`
--
ALTER TABLE `lecture_comments`
  ADD CONSTRAINT `lecture_comments_lecture_id_foreign` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`lecture_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lecture_comments_parent_comment_id_foreign` FOREIGN KEY (`parent_comment_id`) REFERENCES `lecture_comments` (`comment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lecture_comments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `lecture_resources`
--
ALTER TABLE `lecture_resources`
  ADD CONSTRAINT `lecture_resources_lecture_id_foreign` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`lecture_id`) ON DELETE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscriptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_course_progress`
--
ALTER TABLE `user_course_progress`
  ADD CONSTRAINT `user_course_progress_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_course_progress_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_lecture_progress`
--
ALTER TABLE `user_lecture_progress`
  ADD CONSTRAINT `user_lecture_progress_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_lecture_progress_lecture_id_foreign` FOREIGN KEY (`lecture_id`) REFERENCES `lectures` (`lecture_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_lecture_progress_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_video_progress`
--
ALTER TABLE `user_video_progress`
  ADD CONSTRAINT `user_video_progress_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_video_progress_video_id_foreign` FOREIGN KEY (`video_id`) REFERENCES `videos` (`video_id`) ON DELETE CASCADE;

--
-- Constraints for table `videos`
--
ALTER TABLE `videos`
  ADD CONSTRAINT `videos_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
