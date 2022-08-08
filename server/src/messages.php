<?php

function respondErrorMsg($httpCode, $message) {
    // http_response_code($httpCode); // not working with CORS
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode(array(
        "status" => "error",
        "message" => $message,
        "code" => $httpCode
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

function respondJSON($httpCode, $payload) {
    // http_response_code($httpCode); // not working with CORS
    header("Content-Type: application/json; charset=utf-8");

    if (gettype($payload) !== "string" && gettype($payload) !== "array") {
        $payload = (array) $payload;
    }

    echo json_encode(array(
        "status" => "success",
        "payload" => $payload,
        "code" => $httpCode
    ), JSON_UNESCAPED_UNICODE);
    exit;
}