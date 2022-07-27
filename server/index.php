<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");

$BASE = './';

require_once('src/jwt.php');
require_once('src/messages.php');
require_once('src/sqlite_conn.php');
require_once('src/user.php');
require_once('src/lists.php');
require_once('src/user_list_relation.php');
require_once('src/list_item.php');
require_once('src/manage_lists.php');
require_once('src/manage_list_items.php');

$PDO = (new SQLiteConnection())->connect();
try {
    $USER = new User($PDO);
    $LISTS = new Lists($PDO);
    $USER_LIST = new UserListRelation($PDO);
    $LIST_ITEMS = new ListItems($PDO);

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

    // add lists
    if (isset($_POST) && isset($_GET['add-list'])) {
        addList();
        return;
    }

    // get lists
    if (isset($_GET) && isset($_GET['get-lists'])) {
        getLists();
        return;
    }

    // update list
    if (isset($_POST) && isset($_GET['update-list'])) {
        updateList();
        return;
    }

    // delete list
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['delete-list'])) {
        deleteList();
        return;
    }

    // add item
    if (isset($_POST) && isset($_GET['add-item'])) {
        addListItem();
        return;
    }

    // get items
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['get-items-for-list'])) {
        getListItems();
        return;
    }

    // update done
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['update-done'])) {
        updateDone();
        return;
    }


} catch (Exception $e) {
    respondErrorMsg(500, $e);
}