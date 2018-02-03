-- MySQL dump 10.13  Distrib 5.6.28, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: apichallenge3
-- ------------------------------------------------------
-- Server version	5.6.28-0ubuntu0.15.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `champions`
--

DROP TABLE IF EXISTS `champions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `champions` (
  `id` int(11) NOT NULL,
  `name` varchar(20) DEFAULT NULL,
  `full` varchar(30) DEFAULT NULL,
  `sprite` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `champ_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `current_mastery`
--

DROP TABLE IF EXISTS `current_mastery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `current_mastery` (
  `summoner_id` bigint(20) NOT NULL DEFAULT '0',
  `champion_id` bigint(20) NOT NULL DEFAULT '0',
  `mastery_level` int(11) DEFAULT NULL,
  `pts_total` bigint(20) DEFAULT NULL,
  `pts_next` bigint(20) DEFAULT NULL,
  `pts_since` bigint(20) DEFAULT NULL,
  `highest_grade` varchar(5) DEFAULT NULL,
  `chest_granted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`summoner_id`,`champion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gains`
--

DROP TABLE IF EXISTS `gains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gains` (
  `summoner_id` bigint(20) NOT NULL,
  `champion_id` bigint(20) NOT NULL,
  `game_id` bigint(20) NOT NULL,
  `game_timestamp` timestamp NULL DEFAULT NULL,
  `mastery_level` int(11) DEFAULT NULL,
  `pts_gained` bigint(20) DEFAULT NULL,
  `pts_next` bigint(20) DEFAULT NULL,
  `pts_since` bigint(20) DEFAULT NULL,
  `pts_total` bigint(20) DEFAULT NULL,
  KEY `gain_sum_id` (`summoner_id`),
  KEY `gain_champ_id` (`champion_id`),
  KEY `game_timestamp` (`game_timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mastery`
--

DROP TABLE IF EXISTS `mastery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mastery` (
  `summoner_id` bigint(20) DEFAULT NULL,
  `champion_id` bigint(20) DEFAULT NULL,
  `game_id` bigint(20) DEFAULT NULL,
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `championLevel` int(11) DEFAULT NULL,
  `championPoints` bigint(20) DEFAULT NULL,
  `pointsSinceLastLevel` bigint(20) DEFAULT NULL,
  `pointsUntilNextLevel` bigint(20) DEFAULT NULL,
  `processed` tinyint(1) DEFAULT '0',
  UNIQUE KEY `summoner_id` (`summoner_id`,`game_id`),
  KEY `processed` (`processed`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `summoners`
--

DROP TABLE IF EXISTS `summoners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `summoners` (
  `summoner_id` bigint(20) NOT NULL,
  `summoner_name` varchar(100) DEFAULT NULL,
  `update_time` timestamp NULL DEFAULT NULL,
  `summoner_icon` int(11) DEFAULT '0',
  `last_current_mastery_update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`summoner_id`),
  KEY `summoner_name` (`summoner_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-05-10  2:41:16
