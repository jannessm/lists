<?php

class User {
    /**
     * PDO object
     * @var \PDO
     */
    private $pdo;

    /**
     * Initialize the object with a specified PDO object
     * @param \PDO $pdo
     */
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->create_table();
    }

    public function create_table() {
        $sql = "CREATE TABLE IF NOT EXISTS `user` (
            `email` TINYTEXT NOT NULL,
            `password` TINYTEXT NOT NULL,
            `activated` TINYINT NOT NULL DEFAULT 0,
            `dark_theme` TINYINT,
            `last_login` TINYTEXT,
            PRIMARY KEY (`email`)
        );";
        $this->pdo->exec($sql);
    }

    public function add($user) {
        $sql = 'INSERT INTO user (`email`, `password`, `activated`, `dark_theme`, `last_login`) VALUES (:email, :password, 0, NULL, :last_login);';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':email', $user['email']);
        $stmt->bindValue(':password', $user['password']);
        $stmt->bindValue(':last_login', $this->now());

        $stmt->execute();
    }

    public function get($email) {
        $sql = "SELECT user.email, user.password, user.dark_theme, u_s.subscription
                FROM user
                LEFT JOIN (
                    SELECT email, deviceId, subscription
                    FROM user_subscriptions
                    WHERE deviceId=:deviceId
                ) as u_s
                ON user.email=u_s.email
                WHERE user.email=:email";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':email', $email);
        $stmt->bindValue(':deviceId', $_COOKIE['listsId']);
        $stmt->execute();

        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($user['dark_theme'] !== null) {
            $user['dark_theme'] = $user['dark_theme'] === 1 || $user['dark_theme'] === '1';
        }
        $user['subscription'] = $user['subscription'] !== null;

        return $user;
    }

    public function update_password($email, $new_password) {
        $sql = 'UPDATE user SET new_password=:new_password where email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':new_password' => $new_password, ':email' => $email]);
    }

    public function update_theme($email, $dark_theme) {
        $sql = 'UPDATE user SET dark_theme=:theme where email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':theme' => $dark_theme, ':email' => $email]);
    }

    public function update_last_login($email) {
        $sql = 'UPDATE user SET last_login=:last_login where email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':last_login' => $this->now(), ':email' => $email]);
    }

    public function delete($email) {
        $sql = 'DELETE FROM user WHERE email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
    }

    public function delete_inactive() {
        $one_year_ago = new DateTime("now", new DateTimeZone("UTC"));
        $year = new DateInterval("P1Y");
        $one_year_ago->sub($year);
        $sql = 'DELETE FROM user WHERE last_login < :one_year_ago or activated=0';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':one_year_ago' => $one_year_ago->format('c')]);
    }

    public function filter($user) {
        if (!is_array($user)) {
            return $user;
        }

        unset($user['password']);
        unset($user['last_login']);
        unset($user['activated']);

        return $user;
    }

    private function now() {
        date_default_timezone_set("UTC");
        return date('c');
    }
}