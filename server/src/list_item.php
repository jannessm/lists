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
            `time` TINYTEXT,
            `remind` TINYINT NOT NULL DEFAULT 0,
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
        $sql = 'INSERT INTO list_items (uuid, name, time, remind, done, list_id, created_by)VALUES (:uuid, :name, :time, :remind, :done, :list_id, :created_by);';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':uuid', $item['uuid']);
        $stmt->bindValue(':name', $item['name']);
        $stmt->bindValue(':time', $item['time']);
        $stmt->bindValue(':remind', $item['remind']);
        $stmt->bindValue(':done', $item['done']);
        $stmt->bindValue(':created_by', $item['created_by']);
        $stmt->bindValue(':list_id', $item['list_id']);

        $stmt->execute();
    }

    public function get_all_for_list($uuid) {
        $sql = 'SELECT * FROM list_items WHERE list_id=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':uuid', $uuid);
        $stmt->execute();
        
        $items = [];
        while($item = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $item['done'] = $item['done'] === 1;
            array_push($items, $item);
        }

        return $items;
    }

    public function get_all_in_due($email) {
        $sql = 'SELECT li.uuid, li.name, li.time, li.remind, ul.uuid as list_id, ul.email
                FROM list_items as li
                LEFT JOIN (
                    SELECT email, uuid
                    FROM user_list
                    WHERE email=:email
                ) as ul
                ON li.list_id=ul.uuid
                WHERE li.time is not null AND
                      li.remind=1 AND
                      datetime(li.time) <= datetime("now");';

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':email', $email);
        $stmt->execute();
        
        $items = [];
        while($item = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            array_push($items, $item);
        }

        return $items;
    }

    public function update_done($uuids, $done) {
        $sql = 'UPDATE list_items SET done=? WHERE uuid IN (' . $this->add_uuid_placeholders($uuids) . ');';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(array_merge([$done], $uuids));
    }

    public function update($item) {
        $sql = 'UPDATE list_items SET name=:name, time=:time, remind=:remind WHERE uuid=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':name' => $item['name'], ':time' => $item['time'], ':uuid' => $item['uuid'], ':remind' => $item['remind']]);
    }

    public function delete($uuids) {
        $sql = 'DELETE FROM list_items WHERE uuid IN (' . $this->add_uuid_placeholders($uuids) . ');';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($uuids);
    }

    public function delete_all_for_list($uuid) {
        $sql = 'DELETE FROM list_items WHERE list_id=:uuid;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':uuid' => $uuid]);
    }

    public function delete_all_without_list() {
        $sql = 'DELETE FROM list_items WHERE list_id NOT IN (SELECT uuid FROM user_list);';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

    }

    private function add_uuid_placeholders($uuids) {
        return implode(',', array_map(fn($uuid) => '?', $uuids));
    }
}