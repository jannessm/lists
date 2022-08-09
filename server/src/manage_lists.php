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
    
    if ($_GET['email'] === '') {
        respondErrorMsg(400, "provide user email");
        return;
    }

    $lists = $LISTS->get_all_for_user(urldecode($_GET['email']));

    respondJSON(200, $lists);
}

function updateList() {
    global $LISTS;
    $payload = json_decode(file_get_contents("php://input"), true);

    $LISTS->update($payload);

    respondJSON(201, "list updated");
}

function shareList() {
    global $USER_LIST, $USER;
    $payload = json_decode(file_get_contents("php://input"), true);

    $user = $USER->get($payload['email']);

    if ($user) {
        $USER_LIST->add($payload['email'], $payload['uuid']);
        respondJSON(201, "list shared");
    } else {
        respondErrorMsg(400, "user not found");
    }

}

function deleteList() {
    global $USER, $USER_LIST, $LISTS, $LIST_ITEMS;

    $email = urldecode($_GET['email']);

    $user = $USER->get($email);

    if (!$user) {
        respondErrorMsg(400, "user not found");
        return;
    }

    $delete = $USER_LIST->delete($email, $_GET['uuids']);
    
    if ($delete) {
        $LISTS->delete($_GET['uuid']);
        $LIST_ITEMS->delete_all_for_list($_GET['uuid']);
    }

    respondJSON(201, "list deleted");
}