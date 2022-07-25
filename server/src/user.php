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
            `list_ids` TINYTEXT DEFAULT '[]',
            PRIMARY KEY (`email`)
        );";
        $this->pdo->exec($sql);
    }

    public function add($user) {
        $sql = 'INSERT INTO user VALUES (:email, :password, :default_list, :list_ids);';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':email', $user['email']);
        $stmt->bindValue(':password', $user['password']);
        $stmt->bindValue(':list_ids', json_encode([]));

        if (array_key_exists('default_list', $user)) {
            $stmt->bindValue(':default_list', $user['default_list']);
        } else {
            $stmt->bindValue(':default_list', NULL);
        }

        $stmt->execute();
    }

    public function get($email) {
        $sql = 'SELECT * from user where `email`=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':email', $email);
        $stmt->execute();

        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        $user['list_ids'] = json_decode($user['list_ids']);

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

    public function add_list($email, $uuid) {
        $user = $this->get($email);

        if (!$user) {
            throw Exception("User not found");
            return;
        }

        if (!in_array($uuid, $user['list_ids'])) {
            array_push($user['list_ids'], $uuid);
            $this->update_lists($email, $user['list_ids']);
        }
    }

    private function update_lists($email, $list_ids) {
        $sql = 'UPDATE user SET list_ids=:list_ids WHERE email=:email';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':email' => $email, ':list_ids' => json_encode($list_ids)]);
    }

    public function filter($user) {
        if (!is_array($user)) {
            return $user;
        }

        unset($user['password']);

        return $user;
    }
}