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
            `default_list` TINYTEXT,
            PRIMARY KEY (`email`)
        );";
        $this->pdo->exec($sql);
    }

    public function add($user) {
        $sql = 'INSERT INTO user VALUES (:email, :password, :default_list);';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':email', $user['email']);
        $stmt->bindValue(':password', $user['password']);

        if (array_key_exists('default_list', $user)) {
            $stmt->bindValue(':default_list', $user['default_list']);
        } else {
            $stmt->bindValue(':default_list', NULL);
        }

        $stmt->execute();
    }

    public function get($email) {
        $sql = 'SELECT email, password, default_list, list_ids from user Left JOIN (
                SELECT email as ul_email, GROUP_CONCAT(uuid, ",") AS list_ids FROM user_list WHERE `email`=:email GROUP BY email
            ) ON email=ul_email where `email`=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':email', $email);
        $stmt->execute();

        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($user && $user['list_ids'] && $user['list_ids'] !== '' && $user['list_ids'] !== NULL) {
            $user['list_ids'] = explode(",", $user['list_ids']);
        } elseif ($user) {
            $user['list_ids'] = [];
        }

        return $user;
    }

    public function update_password($email, $new_password) {
        $sql = 'UPDATE user SET new_password=:new_password where email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':new_password' => $new_password, ':email' => $email]);
    }

    public function delete($email) {
        $sql = 'DELETE FROM user WHERE email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
    }

    public function filter($user) {
        if (!is_array($user)) {
            return $user;
        }

        unset($user['password']);

        return $user;
    }
}