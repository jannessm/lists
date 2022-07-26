<?php

function addList() {
    global $LISTS, $USER, $USER_LIST;
    $payload = json_decode(file_get_contents("php://input"), true);

    $user = $USER->get($payload['email']);

    if ($user) {
        $LISTS->add($payload['list']);
        $USER_LIST->add($payload['email'], $payload['list']['uuid']);
        respondJSON(201, "list added");
    } else {
        respondErrorMsg(400, "user not found");
    }

}

function getLists() {
    global $LISTS;

    $list_ids = [];
    
    if ($_GET['list_ids'] === '') {
        respondJSON(200, []);
        return;
    
    } elseif (strpos($_GET['list_ids'], ',') === false) {
        $list_ids = [$_GET['list_ids']];
    } else {
        $list_ids = explode(",", $_GET['list_ids']);
    }

    $lists = $LISTS->get_all_for_user($list_ids);

    respondJSON(200, $lists);
}

function updateList() {
    global $LISTS;
    $payload = json_decode(file_get_contents("php://input"), true);

    $LISTS->update($payload);

    respondJSON(201, "list updated");
}

function deleteList() {
    global $USER, $USER_LIST, $LISTS;

    $user = $USER->get($_GET['email']);

    if (!$user) {
        respondErrorMsg(400, "user not found");
        return;
    }

    $LISTS->delete($_GET['uuid']);
    $USER_LIST->delete_all_list($_GET['uuid']);

    respondJSON(201, "list deleted");
}