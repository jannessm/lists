<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

$BASE = './';

require_once('src/jwt.php');
require_once('src/messages.php');
require_once('src/sqlite_conn.php');
require_once('src/user.php');

$PDO = (new SQLiteConnection())->connect();
try {
    $USER = new User($PDO);

    // register
    if (isset($_POST) && isset($_GET['register'])) {
        register();
        return;
    }
    
    if (!isValidJWT() && !isset($POST) && !isset($_GET['login'])) {
        respondErrorMsg(401, "No valid credentials nor valid JWT.");
        return;
    }
    
    // login
    if (isset($_POST) && isset($_GET['login'])) {
        login();
        return;
    }
    
    // validateJWT
    if (isset($_POST) && isset($_GET['validate'])) {
        validateJWT();
        return;
    }

} catch (Exception $e) {
    respondErrorMsg(500, $e);
}