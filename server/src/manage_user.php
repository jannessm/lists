<?php

function setTheme() {
    global $USER;

    $payload = json_decode(file_get_contents("php://input"), true);

    $USER->update_theme($payload['email'], $payload['dark_theme']);

    respondJSON(201, 'updated theme');
}