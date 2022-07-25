<?php

class Lists {
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
        $sql = "CREATE TABLE IF NOT EXISTS `lists` (
            `uuid` TINYTEXT NOT NULL,
            `name` TINYTEXT NOT NULL,
            `groceries` TINYINT NOT NULL DEFAULT 0,
            PRIMARY KEY (`uuid`)
        );";
        $this->pdo->exec($sql);
    }

    public function add($list) {
        $sql = 'INSERT INTO lists VALUES (:uuid, :name, :groceries);';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':uuid', $list['uuid']);
        $stmt->bindValue(':name', $list['name']);
        $stmt->bindValue(':groceries', $list['groceries']);

        $stmt->execute();
    }

    public function get_all_for_user($uuids) {
        if (count($uuids) > 1) {
            $lists = array_map(fn($uuid) => 'uuid="' . $uuid . '"', $uuids);
            $sql = "SELECT * FROM lists WHERE " . implode(' OR ', $lists) . ";";
            // var_dump($sql);
            $stmt = $this->pdo->prepare($sql);
        } else {
            $sql = "SELECT * FROM lists WHERE uuid=:uuids;";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':uuids', $uuids[0]);
        }

        $stmt->execute();

        $lists = [];
        while ($list = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            array_push($lists, $list);
        }

        return $lists;
    }

    public function delete($email) {
        $sql = 'DELETE FROM user WHERE email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
    }
}