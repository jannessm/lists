<?php

class ListItems {
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
        $sql = "CREATE TABLE IF NOT EXISTS `list_items` (
            `uuid` TINYTEXT NOT NULL,
            `name` TINYTEXT NOT NULL,
            `time` TINYTEXT NOT NULL,
            `done` TINYINT NOT NULL DEFAULT 0,
            `list_id` TINYTEXT NOT NULL,
            `created_by` TINYTEXT NOT NULL,
            PRIMARY KEY (`uuid`),
            FOREIGN KEY (`created_by`) REFERENCES user(`email`),
            FOREIGN KEY (`list_id`) REFERENCES lists(`uuid`)
        );";
        $this->pdo->exec($sql);
    }

    public function add($item) {
        $sql = 'INSERT INTO list_items VALUES (:uuid, :name, :time, :done, :created_by, :list_id);';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':uuid', $item['uuid']);
        $stmt->bindValue(':name', $item['name']);
        $stmt->bindValue(':time', $item['time']);
        $stmt->bindValue(':done', $item['done']);
        $stmt->bindValue(':created_by', $item['created_by']);
        $stmt->bindValue(':list_id', $item['list_id']);

        $stmt->execute();
    }

    public function get_for_list($uuid) {
        $sql = 'SELECT * FROM list_items WHERE list_id=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':uuid', $uuid);
        $stmt->execute();

        $item = $stmt->fetch(\PDO::FETCH_ASSOC);

        $item['done'] = $item['done'] === 1;

        return $item;
    }

    public function delete($uuid) {
        $sql = 'DELETE FROM list_items WHERE uuid=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':uuid' => $uuid]);
    }
}