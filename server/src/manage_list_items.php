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
