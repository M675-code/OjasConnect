-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: ojas_connect
-- ------------------------------------------------------
-- Server version	8.0.44

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
-- Table structure for table `businesses`
--

DROP TABLE IF EXISTS `businesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `businesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `business_name` varchar(150) NOT NULL,
  `dba_name` varchar(150) DEFAULT NULL,
  `business_structure` varchar(100) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `business_address` text,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `fk_businesses_user` (`user_id`),
  CONSTRAINT `businesses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_businesses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `businesses`
--

LOCK TABLES `businesses` WRITE;
/*!40000 ALTER TABLE `businesses` DISABLE KEYS */;
INSERT INTO `businesses` VALUES (1,2,'Doe Tech Solutions',NULL,NULL,NULL,'IT Services',NULL,'Web development company'),(7,6,'Avichal Tech Group',NULL,NULL,NULL,'Software Development','123 Tech Park, Indore',NULL),(8,7,'Anshul Consultancies',NULL,NULL,NULL,'Financial Services','456 Business Hub, Indore',NULL),(9,8,'Sumit Trading Co.',NULL,NULL,NULL,'Retail','789 Market Square, Indore',NULL),(10,9,'Pankaj Design Studio',NULL,NULL,NULL,'Graphic Design','101 Creative Ave, Indore',NULL),(11,10,'Patni Logistics',NULL,NULL,NULL,'Supply Chain','202 Transport Nagar, Indore',NULL);
/*!40000 ALTER TABLE `businesses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_rsvps`
--

DROP TABLE IF EXISTS `event_rsvps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_rsvps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `status` enum('going','not_going','maybe') DEFAULT 'going',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_rsvp` (`event_id`,`user_id`),
  KEY `fk_event_rsvps_user` (`user_id`),
  CONSTRAINT `event_rsvps_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_rsvps_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_rsvps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_rsvps`
--

LOCK TABLES `event_rsvps` WRITE;
/*!40000 ALTER TABLE `event_rsvps` DISABLE KEYS */;
INSERT INTO `event_rsvps` VALUES (1,1,1,'going'),(6,2,1,'going');
/*!40000 ALTER TABLE `event_rsvps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `event_date` datetime NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'test','test',NULL,'2026-04-20 14:36:00',1,'2026-04-20 09:06:03'),(2,'Test1','Test1',NULL,'2026-04-24 16:32:00',1,'2026-04-22 10:03:11'),(3,'Test2 ','Test2',NULL,'2026-04-23 19:07:00',1,'2026-04-23 13:37:55');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invites`
--

DROP TABLE IF EXISTS `invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `type` enum('invite','password_reset') NOT NULL DEFAULT 'invite',
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_invites_email` (`email`),
  KEY `idx_invites_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invites`
--

LOCK TABLES `invites` WRITE;
/*!40000 ALTER TABLE `invites` DISABLE KEYS */;
/*!40000 ALTER TABLE `invites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `employer_name` varchar(150) NOT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `work_address` text,
  PRIMARY KEY (`id`),
  KEY `fk_jobs_user` (`user_id`),
  CONSTRAINT `fk_jobs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kids`
--

DROP TABLE IF EXISTS `kids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `relationship` enum('son','daughter','other') DEFAULT 'son',
  `current_status` enum('school','college','job','business') DEFAULT NULL,
  `details` text,
  PRIMARY KEY (`id`),
  KEY `fk_kids_user` (`user_id`),
  CONSTRAINT `fk_kids_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `kids_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kids`
--

LOCK TABLES `kids` WRITE;
/*!40000 ALTER TABLE `kids` DISABLE KEYS */;
INSERT INTO `kids` VALUES (1,2,NULL,NULL,NULL,'son','school','8th Grade at City High');
/*!40000 ALTER TABLE `kids` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mouse_handover`
--

DROP TABLE IF EXISTS `mouse_handover`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mouse_handover` (
  `id` int NOT NULL AUTO_INCREMENT,
  `current_holder_id` int DEFAULT NULL,
  `previous_holder_id` int DEFAULT NULL,
  `handover_date` datetime DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mouse_handover`
--

LOCK TABLES `mouse_handover` WRITE;
/*!40000 ALTER TABLE `mouse_handover` DISABLE KEYS */;
/*!40000 ALTER TABLE `mouse_handover` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `business_id` int DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','expired') DEFAULT 'pending',
  `payment_status` enum('unpaid','paid') DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spouses`
--

DROP TABLE IF EXISTS `spouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spouses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `anniversary` date DEFAULT NULL,
  `occupation_type` enum('housewife','job','business') DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `details` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_spouses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `spouses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spouses`
--

LOCK TABLES `spouses` WRITE;
/*!40000 ALTER TABLE `spouses` DISABLE KEYS */;
INSERT INTO `spouses` VALUES (1,2,'Jane','Doe','1988-08-24','2010-06-20','business','9998887777','jane.doe@example.com','Owner of Doe Tech Solutions');
/*!40000 ALTER TABLE `spouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` enum('admin','eventmanager','user') DEFAULT 'user',
  `status` enum('active','past') DEFAULT 'active',
  `email` varchar(100) NOT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `residential_address` text,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT 'male',
  `marital_status` enum('single','married','divorced','widowed') DEFAULT 'single',
  `anniversary` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `contact_number` (`contact_number`)
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','active','admin@ojas.com','9876543210','123 Ojas Head Office, Indore','$2b$10$Tu.37GUTADcibeiWgZVjQ.AMaN/8SvBhfIEBVXs9Gi.O8tB6zA.Qi','Super','Admin','1980-01-01','male','married','2005-05-05','2026-04-15 10:36:47'),(2,'user','active','john@example.com','9998887776','456 Palasia Main Road, Indore','$2b$10$Tu.37GUTADcibeiWgZVjQ.AMaN/8SvBhfIEBVXs9Gi.O8tB6zA.Qi','John','Doe','1985-05-15','male','single','2010-06-20','2026-04-15 10:36:47'),(3,'user','active','','','','$2b$10$b7hT9.Zghvkho6wjphswnuTjzX4zd6/E2TIQ5Hzmy40Ax82pA40Tu','','',NULL,'male','single',NULL,'2026-04-20 12:10:55'),(6,'user','active','avichal_7709959712@example.com','7709959712',NULL,'dummy_hashed_password','Avichal','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(7,'user','active','anshul_9893001605@example.com','9893001605',NULL,'dummy_hashed_password','Anshul','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(8,'user','active','sumit_9406652911@example.com','9406652911',NULL,'dummy_hashed_password','SUMIT','JAIN',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(9,'user','active','pankaj_9981159114@example.com','9981159114',NULL,'dummy_hashed_password','Pankaj','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(10,'user','active','ishan_8928046425@example.com','8928046425',NULL,'dummy_hashed_password','Ishan','Patni',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(11,'user','active','aklank_9713377744@example.com','9713377744',NULL,'dummy_hashed_password','Aklank','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(12,'user','active','aditya_9039091945@example.com','9039091945',NULL,'dummy_hashed_password','ADITYA','BAKLIWAL',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(13,'user','active','neeraj_9039525669@example.com','9039525669',NULL,'dummy_hashed_password','Neeraj','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(14,'user','active','chetan_9893270701@example.com','9893270701',NULL,'dummy_hashed_password','Chetan','Salgiya',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(15,'user','active','amol_9425060849@example.com','9425060849',NULL,'dummy_hashed_password','Amol','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(16,'user','active','neeraj_7869283675@example.com','7869283675',NULL,'dummy_hashed_password','Neeraj','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(17,'user','active','abhishek_9826885558@example.com','9826885558',NULL,'dummy_hashed_password','Abhishek Purva','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(18,'user','active','prateek_8277460946@example.com','8277460946',NULL,'dummy_hashed_password','Prateek','Singhai',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(19,'user','active','alok_7566848485@example.com','7566848485',NULL,'dummy_hashed_password','ALOK','MODI',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(20,'user','active','gaurav_9893990381@example.com','9893990381',NULL,'dummy_hashed_password','GAURAV','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(21,'user','active','rohan_9920386706@example.com','9920386706',NULL,'dummy_hashed_password','Rohan','Koriya',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(22,'user','active','ankush_9425400379@example.com','9425400379',NULL,'dummy_hashed_password','Ankush','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(23,'user','active','animesh_9406582066@example.com','9406582066',NULL,'dummy_hashed_password','Animesh','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(24,'user','active','abhishek_9893715651@example.com','9893715651',NULL,'dummy_hashed_password','Abhishek kansal','Kansal',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(25,'user','active','rahul_7692033155@example.com','7692033155',NULL,'dummy_hashed_password','Rahul','jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(26,'user','active','amit_9589342639@example.com','9589342639',NULL,'dummy_hashed_password','Amit','Bukharia',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(27,'user','active','hitesh_9755546060@example.com','9755546060',NULL,'dummy_hashed_password','Hitesh','Bandi',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(28,'user','active','hardik_9926430023@example.com','9926430023',NULL,'dummy_hashed_password','Hardik','Pandya',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(29,'user','active','atishay_8269292195@example.com','8269292195',NULL,'dummy_hashed_password','Atishay','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(30,'user','active','saurabh_9329565020@example.com','9329565020',NULL,'dummy_hashed_password','SAURABH','SALGIA',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(31,'user','active','shaishav_9179333330@example.com','9179333330',NULL,'dummy_hashed_password','Shaishav','Singhai',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(32,'user','active','anil_9826022353@example.com','9826022353',NULL,'dummy_hashed_password','Anil','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(33,'user','active','shubham_9926450880@example.com','9926450880',NULL,'dummy_hashed_password','Shubham','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(34,'user','active','manoj_9893049356@example.com','9893049356',NULL,'dummy_hashed_password','Manoj','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(35,'user','active','yash_7974332310@example.com','7974332310',NULL,'dummy_hashed_password','Yash','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(36,'user','active','sanjeev_9977808444@example.com','9977808444',NULL,'dummy_hashed_password','Sanjeev Neelu','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(37,'user','active','shirish_9826055937@example.com','9826055937',NULL,'dummy_hashed_password','Shirish','Ajmera',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(38,'user','active','nirmal_9810160942@example.com','9810160942',NULL,'dummy_hashed_password','NIRMAL','BADJATE',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(39,'user','active','sachin_8007282968@example.com','8007282968',NULL,'dummy_hashed_password','Sachin','Singhai',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(40,'user','active','shreeya_9424337992@example.com','9424337992',NULL,'dummy_hashed_password','Shreeya','Gandhi',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(41,'user','active','narendra_9826333517@example.com','9826333517',NULL,'dummy_hashed_password','Narendra','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(42,'user','active','vinod_9425338371@example.com','9425338371',NULL,'dummy_hashed_password','Vinod','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(43,'user','active','mayank_9826716248@example.com','9826716248',NULL,'dummy_hashed_password','Mayank','Jain ( Bajj)',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(44,'user','active','sanjeev_9826056783@example.com','9826056783',NULL,'dummy_hashed_password','Sanjeev','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(45,'user','active','nitin_9407572857@example.com','9407572857',NULL,'dummy_hashed_password','Nitin','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(46,'user','active','sulabh_9827017640@example.com','9827017640',NULL,'dummy_hashed_password','Sulabh','Samaiya',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(47,'user','active','kirit_9826999119@example.com','9826999119',NULL,'dummy_hashed_password','Kirit','Singhi',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(48,'user','active','dr_saurabh_8878161641@example.com','8878161641',NULL,'dummy_hashed_password','Dr Saurabh','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(49,'user','active','apurva_9826396000@example.com','9826396000',NULL,'dummy_hashed_password','Apurva','Bakliwal',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(50,'user','active','gaurav_9827288960@example.com','9827288960',NULL,'dummy_hashed_password','GAURAV Nalini','JAIN',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(51,'user','active','nishant_9926864000@example.com','9926864000',NULL,'dummy_hashed_password','Nishant','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(52,'user','active','anuj_9819945600@example.com','9819945600',NULL,'dummy_hashed_password','Anuj','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(53,'user','active','arpit_9826897375@example.com','9826897375',NULL,'dummy_hashed_password','Arpit','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(54,'user','active','sharad_8600650722@example.com','8600650722',NULL,'dummy_hashed_password','Sharad','Choudhary',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(55,'user','active','mickey_9826411414@example.com','9826411414',NULL,'dummy_hashed_password','Mickey','Sethi',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(56,'user','active','sumit_9827206668@example.com','9827206668',NULL,'dummy_hashed_password','Sumit','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(57,'user','active','sumit_8602416233@example.com','8602416233',NULL,'dummy_hashed_password','Sumit','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(58,'user','active','subhash_9425107240@example.com','9425107240',NULL,'dummy_hashed_password','Subhash','Agrawal',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(59,'user','active','ayush_9977959171@example.com','9977959171',NULL,'dummy_hashed_password','Ayush','Soni',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(60,'user','active','atishay_9910976375@example.com','9910976375',NULL,'dummy_hashed_password','Atishay','Samaiya',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(61,'user','active','ankit_7778067778@example.com','7778067778',NULL,'dummy_hashed_password','Ankit','Agrawal',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(62,'user','active','shashank_8800437201@example.com','8800437201',NULL,'dummy_hashed_password','Shashank','Malaiya',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(63,'user','active','vishal_9425911737@example.com','9425911737',NULL,'dummy_hashed_password','Vishal','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(64,'user','active','ankur_9993553766@example.com','9993553766',NULL,'dummy_hashed_password','Ankur Vaishali','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(65,'user','active','ashish_9930099918@example.com','9930099918',NULL,'dummy_hashed_password','Ashish','Seth',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(66,'user','active','shelendra_9827220600@example.com','9827220600',NULL,'dummy_hashed_password','Shelendra soni','Soni',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(67,'user','active','ashish_9009650904@example.com','9009650904',NULL,'dummy_hashed_password','Ashish Amita','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(68,'user','active','rajesh_9826048105@example.com','9826048105',NULL,'dummy_hashed_password','RAJESH KUMAR','JAIN',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(69,'user','active','akshay_8889911906@example.com','8889911906',NULL,'dummy_hashed_password','Akshay Jain','JAIN',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(70,'user','active','prateek_9827013187@example.com','9827013187',NULL,'dummy_hashed_password','Prateek Shweta','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(71,'user','active','ajay_9752529299@example.com','9752529299',NULL,'dummy_hashed_password','Ajay Ajmera','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(72,'user','active','amit_9926084330@example.com','9926084330',NULL,'dummy_hashed_password','Amit','Patni',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(73,'user','active','anand_9926945000@example.com','9926945000',NULL,'dummy_hashed_password','Anand Deepti','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(74,'user','active','arun_9827271014@example.com','9827271014',NULL,'dummy_hashed_password','Arun Meena','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(75,'user','active','atul_9826016718@example.com','9826016718',NULL,'dummy_hashed_password','Atul Nutan','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(76,'user','active','gaurav_8989135151@example.com','8989135151',NULL,'dummy_hashed_password','Gaurav Sonam','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(77,'user','active','kamal_9425316840@example.com','9425316840',NULL,'dummy_hashed_password','Kamal Shailey','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(78,'user','active','rahul_8815693442@example.com','8815693442',NULL,'dummy_hashed_password','Rahul Preeti','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(79,'user','active','sachin_9302325141@example.com','9302325141',NULL,'dummy_hashed_password','Sachin','Gangwal',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(80,'user','active','shailendra_8982238308@example.com','8982238308',NULL,'dummy_hashed_password','Shailendra Soniya','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(81,'user','active','vijay_9993222211@example.com','9993222211',NULL,'dummy_hashed_password','Vijay Shilpa','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(82,'user','active','rajneesh_9827040022@example.com','9827040022',NULL,'dummy_hashed_password','Rajneesh Jain','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(83,'user','active','nitesh_9342331121@example.com','9342331121',NULL,'dummy_hashed_password','Nitesh Godha','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(84,'user','active','rahul_9314079100@example.com','9314079100',NULL,'dummy_hashed_password','Rahul IDFC','JAIN',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(85,'user','active','rajeev_9753091000@example.com','9753091000',NULL,'dummy_hashed_password','Rajeev Jain','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(86,'user','active','akshoy_pandvia_admin@example.com',NULL,NULL,'dummy_hashed_password','Akshoy Pandvia','Jain',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(87,'user','active','apoorva_9406834522@example.com','9406834522',NULL,'dummy_hashed_password','Apoorva Akansha','Sogani',NULL,'male','single',NULL,'2026-04-23 03:29:12'),(88,'user','active','preet_7898787873@example.com','7898787873',NULL,'dummy_hashed_password','Preet Shrashti','Sogani',NULL,'male','single',NULL,'2026-04-23 03:29:12');
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

-- Dump completed on 2026-04-24 12:14:55
