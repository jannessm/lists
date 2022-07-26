<?php

class UserListRelation {
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
        $sql = "CREATE TABLE IF NOT EXISTS `user_list` (
            `email` TINYTEXT NOT NULL,
            `uuid` TINYTEXT NOT NULL,
            FOREIGN KEY (`email`) REFERENCES user(`email`),
            FOREIGN KEY (`uuid`) REFERENCES lists(`uuid`)
        );";
        $this->pdo->exec($sql);
    }

    public function add($email, $uuid) {
        $sql = 'INSERT INTO user_list VALUES (:email, :uuid);';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':email', $email);
        $stmt->bindValue(':uuid', $uuid);

        $stmt->execute();
    }

    public function delete($email, $uuid) {
        $sql = 'DELETE FROM user_list WHERE email=:email AND uuid=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':email' => $email, ':uuid' => $uuid]);
    }

    public function delete_all_user($email) {
        $sql = 'DELETE FROM user_list WHERE email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
    }

    public function delete_all_list($uuid) {
        $sql = 'DELETE FROM user_list WHERE uuid=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':uuid' => $uuid]);
    }
}