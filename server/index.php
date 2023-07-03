<?php

function cors() {
    
    // Allow from any origin
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        // Decide if the origin in $_SERVER['HTTP_ORIGIN'] is one
        // you want to allow, and if so:
        header("Access-Control-Allow-Origin: *");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
    }
    
    // Access-Control headers are received during OPTIONS requests
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            // may also be using PUT, PATCH, HEAD etc
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    
        exit(0);
    }
}
cors();

$BASE = './';


require_once('src/jwt.php');
require_once('src/messages.php');
require_once('src/sqlite_conn.php');
require_once('src/user.php');
require_once('src/lists.php');
require_once('src/user_list_relation.php');
require_once('src/user_subscriptions.php');
require_once('src/list_item.php');
require_once('src/manage_user.php');
require_once('src/manage_lists.php');
require_once('src/manage_list_items.php');

if (isset($_GET['ping'])) {
    return;
}

$sqlconn = new SQLiteConnection();
$PDO = $sqlconn->connect();

try {
    $USER = new User($PDO);
    $LISTS = new Lists($PDO);
    $USER_LIST = new UserListRelation($PDO);
    $USER_SUBSCRIPTIONS = new UserSubscriptions($PDO);
    $LIST_ITEMS = new ListItems($PDO);

    // register
    if (isset($_POST) && isset($_GET['register'])) {
        register();

        $sqlconn->backup();
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

    // set Theme
    if (isset($_POST) && isset($_GET['update-theme'])) {
        setTheme();
        return;
    }

    // add lists
    if (isset($_POST) && isset($_GET['add-list'])) {
        addList();

        $sqlconn->backup();
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

        $sqlconn->backup();
        return;
    }

    // share list
    if (isset($_POST) && isset($_GET['share-list'])) {
        shareList();

        $sqlconn->backup();
        return;
    }

    // delete list
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['delete-list'])) {
        deleteList();

        $sqlconn->backup();
        return;
    }

    // add item
    if (isset($_POST) && isset($_GET['add-item'])) {
        addListItem();

        $sqlconn->backup();
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

        $sqlconn->backup();
        return;
    }

    // update item
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['update-item'])) {
        updateItem();

        $sqlconn->backup();
        return;
    }

    // delete item
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['delete-items'])) {
        deleteItem();

        $sqlconn->backup();
        return;
    }

    //add push subscription
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['add-subscription'])) {
        add_subscription();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['remove-subscription'])) {
        remove_subscription();
    }

    // get grocery categories
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['grocery-categories'])) {
        $data = [];
        $handle = fopen($BASE . 'grocery_categories.tsv', 'rb');
        $f = [];
        while (!feof($handle)) {
            $f[] = fgets($handle);
        }
        
        // read categories
        $header = str_getcsv($f[0], "\t");
        foreach($header as $h) {
            $data[$h] = [];
        }

        array_splice($f, 0, 1);

        foreach ($f as $row) {
            $row = str_getcsv($row, "\t");
            foreach($row as $col => $val) {
                if ($val) {
                    //remove diacritics, trim, lowercase
                    $val = strtolower(trim($val));
                    $regexp = '/&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml|caron);/i';
                    $val = html_entity_decode(preg_replace($regexp, '$1', htmlentities($val)));
                    
                    array_push($data[$header[$col]], $val);
                }
            }
        }

        respondJSON(200, $data);
    }

} catch (Exception $e) {
    var_dump($e);
    respondErrorMsg(500, $e);
}