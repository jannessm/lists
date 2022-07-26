<?php
    use Firebase\JWT\JWT;
    use Firebase\JWT\ExpiredException;
    require_once($BASE . 'vendor/autoload.php');
    require_once($BASE . 'secrets.php');

    function generateJWT($user) {
        global $jwtPrivateKey, $serverName;
        
        $issuedAt   = new DateTimeImmutable();
        $expire     = $issuedAt->modify('+7 day')->getTimestamp();      // Add 60 seconds

        $data = [
            'iat'  => $issuedAt->getTimestamp(),         // Issued at: time when the token was generated
            'iss'  => $serverName,                       // Issuer
            'nbf'  => $issuedAt->getTimestamp(),         // Not before
            'exp'  => $expire,                           // Expire
            'user' => $user,                             // User name
        ];

        return JWT::encode(
            $data,
            $jwtPrivateKey,
            'RS256'
        );
    }

    function hasJWT() {
        return preg_match('/Bearer\s"(\S+)"/', $_SERVER['HTTP_AUTHORIZATION'], $matches);
    }

    function isValidJWT() {
        global $serverName;
        
        try {
            $token = decodeToken(readToken());
        } catch (Exception $e) {
            return false;
        }

        if(!$token) {
            return false;
        }
        
        $now = new DateTimeImmutable();

        return ($token->iss === $serverName && // issuer is the same
            $token->nbf <= $now->getTimestamp() && // create time is in past
            $token->exp >= $now->getTimestamp()); // expire time is in future
    }

    function readToken() {
        if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return;
        }
        
        preg_match('/Bearer\s\"(\S+)\"/', $_SERVER['HTTP_AUTHORIZATION'], $matches);

        // check if token is in header
        if (!hasJWT()) {
            return;
        }
        
        $jwt = $matches[1];

        // if no jwt could be found by regex
        if (!$jwt) {
            return;
        }

        return $jwt;
    }

    function decodeToken($jwt) {
        if (!$jwt) {
            return;
        }
        global $jwtPublicKey, $serverName;

        try {
            $token = JWT::decode($jwt, $jwtPublicKey, ['RS256']);
        } catch (ExpiredException $e) {
            return;
        }

        return $token;
    }

    function login() {
        global $USER;
        $payload = json_decode(file_get_contents("php://input"), true);
        $email = strtolower($payload['email']);
        $user = $USER->get($email);
    
        // check credentials and generate jwt on success
        if ($user && str_replace('"', '', $user['password']) === $payload['pwd']) {
            $jwtData = $USER->filter($user);
            $jwt_and_expire_date = generateJWT($jwtData);
    
            respondJSON(201, $jwt_and_expire_date);
    
        // credentials are wrong
        } else if ($user && str_replace('"', '', $user['password']) !== $payload['pwd']){
            respondErrorMsg(401, "invalid credentials");
        } else {
            respondErrorMsg(400, "user not found");
        }
    }

    function register() {
        global $USER;
        $payload = json_decode(file_get_contents("php://input"), true);
        $payload['email'] = strtolower($payload['email']);
        $payload['password'] = str_replace('"', '', $payload['pwd']);
        unset($payload['pwd']);

        if ($payload['email'] !== '' && $payload['password'] !== '') {
            $USER->add($payload);
            $user = $USER->get($payload['email']);
    
            respondJSON(201, generateJWT($USER->filter($user)));
        }
    }
    
    function validateJWT() {
        global $USER;
        $token = decodeToken(readToken());
        
        if (!$token->user) {
            respondErrorMsg(400, "token has no user object.");
        }
        
        $user = $USER->get($token->user->email);

        if ($user) {
            // refresh jwt
            respondJSON(201, generateJWT($USER->filter($user)));
        } else {
            respondErrorMsg(400, "user not found");
        }
        
    }