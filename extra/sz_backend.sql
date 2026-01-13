CREATE DATABASE  IF NOT EXISTS `sz_backend` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sz_backend`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: sz_backend
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `authorities`
--

DROP TABLE IF EXISTS `authorities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authorities` (
  `authority_id` bigint NOT NULL AUTO_INCREMENT,
  `authority_name` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`authority_id`),
  UNIQUE KEY `authority_name` (`authority_name`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authorities`
--

LOCK TABLES `authorities` WRITE;
/*!40000 ALTER TABLE `authorities` DISABLE KEYS */;
INSERT INTO `authorities` VALUES (1,'PROFILE_VIEW','View user profile','2025-12-19 13:54:29','2025-12-19 13:54:29'),(2,'PROFILE_EDIT','Edit own profile','2025-12-19 13:54:29','2025-12-19 13:54:29'),(3,'CHAT_SEND','Send chat messages','2025-12-19 13:54:29','2025-12-19 13:54:29'),(4,'CHAT_VIEW','View chat messages','2025-12-19 13:54:29','2025-12-19 13:54:29'),(5,'MEDIA_UPLOAD','Upload photos or videos','2025-12-19 13:54:29','2025-12-19 13:54:29'),(6,'STREAM_CREATE','Create live stream','2025-12-19 13:54:45','2025-12-19 13:54:45'),(7,'STREAM_START','Start live stream','2025-12-19 13:54:45','2025-12-19 13:54:45'),(8,'STREAM_END','End live stream','2025-12-19 13:54:45','2025-12-19 13:54:45'),(9,'STREAM_MODERATE','Moderate own stream','2025-12-19 13:54:45','2025-12-19 13:54:45'),(10,'USER_REPORT_VIEW','View user reports','2025-12-19 13:55:01','2025-12-19 13:55:01'),(11,'USER_WARN','Warn users','2025-12-19 13:55:01','2025-12-19 13:55:01'),(12,'USER_SUSPEND','Suspend users','2025-12-19 13:55:01','2025-12-19 13:55:01'),(13,'USER_BAN','Ban users','2025-12-19 13:55:01','2025-12-19 13:55:01'),(14,'ROLE_ASSIGN','Assign roles to users','2025-12-19 13:55:50','2025-12-19 13:55:50'),(15,'AUTHORITY_ASSIGN','Assign authorities','2025-12-19 13:55:50','2025-12-19 13:55:50'),(16,'SYSTEM_CONFIG','Modify system configuration','2025-12-19 13:55:50','2025-12-19 13:55:50'),(17,'ADMIN_PANEL_ACCESS','Access admin dashboard','2025-12-19 13:55:50','2025-12-19 13:55:50');
/*!40000 ALTER TABLE `authorities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coin_packages`
--

DROP TABLE IF EXISTS `coin_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coin_packages` (
  `package_id` bigint NOT NULL AUTO_INCREMENT,
  `coins` bigint NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `bonus_coins` bigint DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`package_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coin_packages`
--

LOCK TABLES `coin_packages` WRITE;
/*!40000 ALTER TABLE `coin_packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `coin_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coin_purchases`
--

DROP TABLE IF EXISTS `coin_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coin_purchases` (
  `purchase_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `package_id` bigint NOT NULL,
  `coins` bigint NOT NULL DEFAULT '0',
  `gateway` enum('RAZORPAY','STRIPE','PAYPAL','UPI') NOT NULL,
  `gateway_txn_id` varchar(100) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `status` enum('INITIATED','SUCCESS','FAILED','REFUNDED') DEFAULT 'INITIATED',
  `credited` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`purchase_id`),
  UNIQUE KEY `gateway_txn_id` (`gateway_txn_id`),
  KEY `fk_purchase_user` (`user_id`),
  KEY `fk_purchase_package` (`package_id`),
  CONSTRAINT `fk_purchase_package` FOREIGN KEY (`package_id`) REFERENCES `coin_packages` (`package_id`),
  CONSTRAINT `fk_purchase_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coin_purchases`
--

LOCK TABLES `coin_purchases` WRITE;
/*!40000 ALTER TABLE `coin_purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `coin_purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coin_transactions`
--

DROP TABLE IF EXISTS `coin_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coin_transactions` (
  `transaction_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `coins` bigint NOT NULL COMMENT 'Positive for gain, Negative for spend',
  `transaction_type` enum('PURCHASE','GIFT_SENT','GIFT_RECEIVED','BONUS','REFUND','ADMIN_ADJUST') NOT NULL,
  `reference_id` bigint DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `balance_after` bigint NOT NULL,
  `status` enum('SUCCESS','PENDING','FAILED') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_type` (`user_id`,`transaction_type`),
  CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coin_transactions`
--

LOCK TABLES `coin_transactions` WRITE;
/*!40000 ALTER TABLE `coin_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `coin_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gift_leaderboards`
--

DROP TABLE IF EXISTS `gift_leaderboards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_leaderboards` (
  `live_stream_id` bigint unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  `total_coins` bigint DEFAULT NULL,
  PRIMARY KEY (`live_stream_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_stream_coins` (`live_stream_id`,`total_coins` DESC),
  CONSTRAINT `gift_leaderboards_ibfk_1` FOREIGN KEY (`live_stream_id`) REFERENCES `user_streams` (`stream_id`),
  CONSTRAINT `gift_leaderboards_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gift_leaderboards`
--

LOCK TABLES `gift_leaderboards` WRITE;
/*!40000 ALTER TABLE `gift_leaderboards` DISABLE KEYS */;
/*!40000 ALTER TABLE `gift_leaderboards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gifts`
--

DROP TABLE IF EXISTS `gifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gifts` (
  `gift_id` bigint NOT NULL AUTO_INCREMENT,
  `gift_name` varchar(50) NOT NULL,
  `gift_icon_url` varchar(255) DEFAULT NULL,
  `coin_cost` bigint NOT NULL,
  `is_animated` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`gift_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gifts`
--

LOCK TABLES `gifts` WRITE;
/*!40000 ALTER TABLE `gifts` DISABLE KEYS */;
INSERT INTO `gifts` VALUES (1,'heart',NULL,150,1,0,'2025-12-27 08:41:21'),(2,'gift_2',NULL,140,0,0,'2025-12-27 08:41:21'),(3,'gift_3',NULL,150,0,1,'2025-12-27 08:41:21'),(4,'check_1','icon_1',14,0,1,'2025-12-27 10:13:52'),(5,'check_2','icon_2',5,0,1,'2025-12-27 10:13:52'),(6,'single_add','iaod',150,0,1,'2025-12-27 10:15:46'),(7,'single_add','iaod',150,0,1,'2025-12-27 10:25:54');
/*!40000 ALTER TABLE `gifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `languages` (
  `language_id` int NOT NULL AUTO_INCREMENT,
  `language_name` varchar(50) NOT NULL,
  PRIMARY KEY (`language_id`),
  UNIQUE KEY `language_name` (`language_name`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `languages`
--

LOCK TABLES `languages` WRITE;
/*!40000 ALTER TABLE `languages` DISABLE KEYS */;
INSERT INTO `languages` VALUES (13,'Bengali'),(1,'English'),(6,'German'),(16,'Gujarati'),(2,'Hindi'),(10,'Indonesian'),(12,'Italian'),(8,'Japanese'),(5,'Kannada'),(9,'Korean'),(17,'Malayalam'),(14,'Marathi'),(7,'Portuguese'),(3,'Tamil'),(4,'Telugu'),(11,'Turkish'),(15,'Urdu');
/*!40000 ALTER TABLE `languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_authorities`
--

DROP TABLE IF EXISTS `role_authorities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_authorities` (
  `role_id` bigint NOT NULL,
  `authority_id` bigint NOT NULL,
  PRIMARY KEY (`role_id`,`authority_id`),
  KEY `authority_id` (`authority_id`),
  CONSTRAINT `role_authorities_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  CONSTRAINT `role_authorities_ibfk_2` FOREIGN KEY (`authority_id`) REFERENCES `authorities` (`authority_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_authorities`
--

LOCK TABLES `role_authorities` WRITE;
/*!40000 ALTER TABLE `role_authorities` DISABLE KEYS */;
INSERT INTO `role_authorities` VALUES (1,1),(2,1),(3,1),(4,1),(1,2),(2,2),(4,2),(1,3),(2,3),(4,3),(1,4),(2,4),(3,4),(4,4),(2,5),(4,5),(2,6),(4,6),(2,7),(4,7),(2,8),(4,8),(2,9),(4,9),(3,10),(4,10),(3,11),(4,11),(3,12),(4,12),(4,13),(4,14),(4,15),(4,16),(4,17);
/*!40000 ALTER TABLE `role_authorities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `role_description` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'USER','Default role for all users','2025-12-19 13:46:51','2025-12-19 13:46:51'),(2,'CREATOR','User who can host live streams','2025-12-19 13:46:51','2025-12-19 13:46:51'),(3,'MODERATOR','Handles reports and moderation','2025-12-19 13:46:51','2025-12-19 13:46:51'),(4,'ADMIN','Full system access','2025-12-19 13:46:51','2025-12-19 13:46:51');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_authorities`
--

DROP TABLE IF EXISTS `user_authorities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_authorities` (
  `user_authority_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `authority_id` bigint NOT NULL,
  `effect` enum('ALLOW','DENY') NOT NULL DEFAULT 'ALLOW',
  `expires_at` timestamp NULL DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_authority_id`),
  UNIQUE KEY `user_id` (`user_id`,`authority_id`),
  KEY `authority_id` (`authority_id`),
  CONSTRAINT `user_authorities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_authorities_ibfk_2` FOREIGN KEY (`authority_id`) REFERENCES `authorities` (`authority_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_authorities`
--

LOCK TABLES `user_authorities` WRITE;
/*!40000 ALTER TABLE `user_authorities` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_authorities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_follows`
--

DROP TABLE IF EXISTS `user_follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_follows` (
  `follower_id` bigint NOT NULL,
  `following_id` bigint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`,`following_id`),
  KEY `following_id` (`following_id`,`follower_id`),
  CONSTRAINT `user_follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_follows`
--

LOCK TABLES `user_follows` WRITE;
/*!40000 ALTER TABLE `user_follows` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_gifts`
--

DROP TABLE IF EXISTS `user_gifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_gifts` (
  `user_gift_id` bigint NOT NULL AUTO_INCREMENT,
  `sender_id` bigint NOT NULL,
  `receiver_id` bigint NOT NULL,
  `gift_id` bigint NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `total_coins` bigint NOT NULL,
  `context_type` enum('CHAT','LIVE','PROFILE','COMMENT') NOT NULL,
  `context_id` bigint DEFAULT NULL,
  `message_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_gift_id`),
  KEY `fk_gift_sender` (`sender_id`),
  KEY `fk_gift_receiver` (`receiver_id`),
  KEY `fk_gift_master` (`gift_id`),
  CONSTRAINT `fk_gift_master` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`gift_id`),
  CONSTRAINT `fk_gift_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_gift_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_gifts`
--

LOCK TABLES `user_gifts` WRITE;
/*!40000 ALTER TABLE `user_gifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_gifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_languages`
--

DROP TABLE IF EXISTS `user_languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_languages` (
  `user_id` bigint NOT NULL,
  `language_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`language_id`),
  KEY `language_id` (`language_id`),
  CONSTRAINT `user_languages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `user_languages_ibfk_2` FOREIGN KEY (`language_id`) REFERENCES `languages` (`language_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_languages`
--

LOCK TABLES `user_languages` WRITE;
/*!40000 ALTER TABLE `user_languages` DISABLE KEYS */;
INSERT INTO `user_languages` VALUES (12,1,'2025-12-27 15:43:22'),(12,2,'2025-12-27 15:43:22');
/*!40000 ALTER TABLE `user_languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_location`
--

DROP TABLE IF EXISTS `user_location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_location` (
  `user_id` bigint NOT NULL,
  `location_id` bigint NOT NULL AUTO_INCREMENT,
  `country` varchar(100) NOT NULL,
  `country_code` varchar(10) NOT NULL,
  `state` varchar(50) NOT NULL,
  `state_district` varchar(100) NOT NULL,
  `post_code` varchar(50) NOT NULL,
  `county` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_location_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_location`
--

LOCK TABLES `user_location` WRITE;
/*!40000 ALTER TABLE `user_location` DISABLE KEYS */;
INSERT INTO `user_location` VALUES (3,1,'India','IN','Karnataka','Blore','563101','NAN'),(12,5,'India','IN','Karnataka','Bengaluru Urban','562106','Anekal');
/*!40000 ALTER TABLE `user_location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (3,1,'2025-12-20 07:40:49','2025-12-20 07:40:49'),(3,2,'2025-12-20 09:45:28','2025-12-20 09:45:28'),(3,3,'2025-12-27 09:01:25','2025-12-27 09:01:25'),(3,4,'2025-12-27 09:01:25','2025-12-27 09:01:25'),(12,1,'2025-12-27 15:43:22','2025-12-27 15:43:22'),(12,2,'2025-12-27 15:43:22','2025-12-27 15:43:22');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_streams`
--

DROP TABLE IF EXISTS `user_streams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_streams` (
  `stream_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `stream_key` varchar(255) NOT NULL,
  `stream_url` text,
  `status` enum('created','live','end','banned') DEFAULT 'created',
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`stream_id`),
  UNIQUE KEY `stream_key` (`stream_key`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `idx_live_streams` (`status`,`started_at`),
  CONSTRAINT `user_streams_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_streams`
--

LOCK TABLES `user_streams` WRITE;
/*!40000 ALTER TABLE `user_streams` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_streams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_wallets`
--

DROP TABLE IF EXISTS `user_wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_wallets` (
  `wallet_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `balance` bigint NOT NULL DEFAULT '0',
  `locked_balance` bigint NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`wallet_id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_wallets`
--

LOCK TABLES `user_wallets` WRITE;
/*!40000 ALTER TABLE `user_wallets` DISABLE KEYS */;
INSERT INTO `user_wallets` VALUES (1,3,0,0,'2025-12-26 09:31:21'),(5,12,0,0,'2025-12-27 15:43:22');
/*!40000 ALTER TABLE `user_wallets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usernames`
--

DROP TABLE IF EXISTS `usernames`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usernames` (
  `username_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `username` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`username_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `user_id` (`user_id`,`is_active`),
  UNIQUE KEY `uq_user_active` (`user_id`,`is_active`),
  CONSTRAINT `usernames_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usernames`
--

LOCK TABLES `usernames` WRITE;
/*!40000 ALTER TABLE `usernames` DISABLE KEYS */;
INSERT INTO `usernames` VALUES (1,3,'FozLw_ash1',1,'2025-12-20 07:40:49','2025-12-20 07:40:49'),(5,12,'EvxEv_Y0i2',1,'2025-12-27 15:43:22','2025-12-27 15:43:22');
/*!40000 ALTER TABLE `usernames` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `firebase_uid` varchar(50) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `bio` text,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `auth_provider` enum('google','phone') DEFAULT 'google',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `firebase_uid` (`firebase_uid`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'FozLwHqEpnfIFYzSKcmuyKb3ash1','Var Fri','1990-01-01','other',NULL,'vv137941@gmail.com',NULL,'google','2025-12-20 07:40:49','2025-12-20 07:40:49'),(12,'EvxEvSLajGVv5KTsN4TRQInMY0i2','Soulzaa','1990-01-01','other',NULL,'soulzaa.project@gmail.com',NULL,'google','2025-12-27 15:43:22','2025-12-27 15:43:22');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-13 16:36:44
