<?php

function addList() {
    global $LISTS, $USER;
    $payload = json_decode(file_get_contents("php://input"), true);

    try {
        $USER->add_list($payload['email'], $payload['list']['uuid']);
    } catch (Exception $e) {
        respondErrorMsg(400, "User not found");
        return;
    }
    
    $LISTS->add($payload['list']);

    respondJSON(201, "list added");
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
    global $USER, $LISTS;

    try {
        $USER->delete_list($_GET['email'], $_GET['uuid']);
    } catch (Exception $e) {
        respondErrorMsg(400, "User not found");
        return;
    }

    $LISTS->delete($_GET['uuid']);

    respondJSON(201, "list deleted");
}