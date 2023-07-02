<?php

function setTheme() {
    global $USER;

    $payload = json_decode(file_get_contents("php://input"), true);

    $USER->update_theme($payload['email'], $payload['dark_theme']);

    respondJSON(201, 'updated theme');
}

function add_subscription() {
    global $USER_SUBSCRIPTIONS;

    $payload = json_decode(file_get_contents("php://input"), true);

    $USER_SUBSCRIPTIONS->addSubscription($payload['email'], $_COOKIE['listsId'], $payload['subscription']);

    respondJSON(201, 'subscription added');
}

function remove_subscription() {
    global $USER_SUBSCRIPTIONS;

    $payload = json_decode(file_get_contents("php://input"), true);

    $USER_SUBSCRIPTIONS->removeSubscription($_GET['email'], $_COOKIE['listsId']);

    respondJSON(201, 'subscription removed');
}