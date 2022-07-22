<?php

function respondErrorMsg($httpCode, $message) {
    // http_response_code($httpCode); // not working with CORS
    header("Content-Type: application/json");
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: *');
    header('Access-Control-Allow-Headers: *');
    echo json_encode(array(
        "status" => "error",
        "message" => $message,
        "code" => $httpCode
    ));
    exit;
}

function respondJSON($httpCode, $payload) {
    // http_response_code($httpCode); // not working with CORS
    header("Content-Type: application/json");
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: *');
    header('Access-Control-Allow-Headers: *');

    if (gettype($payload) !== "string" && gettype($payload) !== "array") {
        $payload = (array) $payload;
    }

    echo json_encode(array(
        "status" => "success",
        "payload" => $payload,
        "code" => $httpCode
    ));
}