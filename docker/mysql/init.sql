CREATE DATABASE IF NOT EXISTS `visitors_db`;

CREATE USER IF NOT EXISTS 'visitor_user'@'%'
  IDENTIFIED WITH caching_sha2_password BY 'visitor_password';

ALTER USER 'visitor_user'@'%'
  IDENTIFIED WITH caching_sha2_password BY 'visitor_password';

GRANT ALL PRIVILEGES ON `visitors_db`.* TO 'visitor_user'@'%';

FLUSH PRIVILEGES;
