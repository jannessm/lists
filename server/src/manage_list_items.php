<?php

function addListItem() {
    global $LIST_ITEMS, $LISTS;
    $payload = json_decode(file_get_contents("php://input"), true);

    $list = $LISTS->get($payload['list_id']);

    if ($list) {
        $LIST_ITEMS->add($payload);
        respondJSON(201, "list item added");
    } else {
        respondErrorMsg(400, "list not found");
    }

}

function getListItems() {
    global $LIST_ITEMS;
    
    $items = $LIST_ITEMS->get_all_for_list($_GET['list_id']);

    respondJSON(200, $items);
}

function updateDone() {
    global $LIST_ITEMS;
    $payload = json_decode(file_get_contents("php://input"), true);

    $LIST_ITEMS->update_done($payload['uuid'], $payload['done']);

    respondJSON(201, "updated done");
}

function deleteItem() {
    global $LIST_ITEMS;
    
    $LIST_ITEMS->delete($_GET['uuid']);

    respondJSON(201, "delete done");
}