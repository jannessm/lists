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
            `uuid` TINYTEXT NOT NULL,
            `email` TINYTEXT NOT NULL,
            `password` TINYTEXT NOT NULL,
            `default_list` TINYTEXT,
            `activated` TINYINT NOT NULL DEFAULT 1,
            PRIMARY KEY (`uuid`)
        );";
        $this->pdo->exec($sql);
    }

    public function add($user) {
        $sql = 'INSERT INTO user VALUES (:uuid, :email, :password, :default_list);';
        $stmt = $this->pdo->prepare($sql);
        
        $stmt->bindValue(':uuid', $user['uuid']);
        $stmt->bindValue(':email', $user['email']);
        $stmt->bindValue(':password', $user['password']);

        if (array_key_exists('default_list', $user)) {
            $stmt->bindValue(':default_list', $user['default_list']);
        } else {
            $stmt->bindValue(':default_list', NULL);
        }

        $stmt->execute();
    }

    public function get($uuid) {
        $sql = 'SELECT * from user where `uuid`=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':uuid', $uuid);
        $stmt->execute();

        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $user;
    }

    public function update_password($uuid, $new_password) {
        $sql = 'UPDATE user SET new_password=:new_password where uuid=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':new_password' => $new_password, ':uuid' => $uuid]);
    }

    public function delete($uuid) {
        $sql = 'DELETE FROM user WHERE uuid=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':uuid' => $uuid]);
    }

    public function filter($user) {
        unset($user['password']);

        return $user;
    }
}