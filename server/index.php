<?php

$BASE = '.';

require_once('src/jwt.php');
require_once('src/messages.php');
require_once('src/sqlite_conn.php');

$PDO = new SQLiteConnection()->connect();
try {
    $USER = new User($PDO);
    
    if (!isValidJWT() && !isset($POST) && !isset($_GET['login'])) {
        respondErrorMsg(401, "No valid credentials nor valid JWT.");
    }
    
    // login
    if (isset($_POST) && isset($_GET['login'])) {
        login();
    }
    
    // validateJWT
    if (isset($_POST) && isset($_GET['validate'])) {
        validateJWT();
    }
} catch (Exception $e) {
    respondErrorMsg(500, $e);
}