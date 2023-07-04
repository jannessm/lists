<?php

class UserSubscriptions {
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
        $sql = "CREATE TABLE IF NOT EXISTS `user_subscriptions` (
            `deviceId` TINYTEXT NOT NULL,
            `email` TINYTEXT NOT NULL,
            `browser` TINYTEXT NOT NULL,
            `os` TINYTEXT NOT NULL,
            `subscription` TINYTEXT,
            FOREIGN KEY (`email`) REFERENCES user(`email`),
            PRIMARY KEY (`deviceId`)
        );";
        $this->pdo->exec($sql);
    }

    public function add($email, $deviceId, $browser, $os, $subscription=null) {
        $sql = 'INSERT INTO user_subscriptions (email, deviceId, browser, os, subscription) VALUES (:email, :deviceId, :browser, :os, :subscription);';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':email', $email);
        $stmt->bindValue(':deviceId', $deviceId);
        $stmt->bindValue(':browser', $browser);
        $stmt->bindValue(':os', $os);

        if (!!$subscription) {
            $stmt->bindValue(':subscription', json_encode($subscription));
        } else {
            $stmt->bindValue(':subscription', null);
        }

        $stmt->execute();
    }

    public function get($email, $deviceId) {
        $sql = 'SELECT email, deviceId FROM user_subscriptions WHERE email=:email AND deviceId=:deviceId;';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':email', $email);
        $stmt->bindValue(':deviceId', $deviceId);

        $stmt->execute();

        $device = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return $device;
    }

    public function addDevice($email, $deviceId) {
        $device = $this->get($email, $deviceId);

        if (!$device) {
            $this->delete($deviceId);
            $browser_info = get_browser(null, true);
            $this->add($email, $deviceId, $browser_info['browser'], $browser_info['platform']);

            return $this->get($email, $deviceId);
        }

        return $device;
    }

    public function addSubscription($email, $deviceId, $subscription) {
        $this->addDevice($email, $deviceId);
        
        $sql = 'UPDATE user_subscriptions SET subscription=:subscription WHERE email=:email AND deviceId=:deviceId;';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':email', $email);
        $stmt->bindValue(':deviceId', $deviceId);
        $stmt->bindValue(':subscription', json_encode($subscription));

        $stmt->execute();
    }

    public function removeSubscription($email, $deviceId) {
        $this->addDevice($email, $deviceId);
        
        $sql = 'UPDATE user_subscriptions SET subscription=:subscription WHERE email=:email AND deviceId=:deviceId;';
        $stmt = $this->pdo->prepare($sql);

        $stmt->bindValue(':email', $email);
        $stmt->bindValue(':deviceId', $deviceId);
        $stmt->bindValue(':subscription', null);

        $stmt->execute();
    }

    public function get_subscribed_users() {
        $sql = 'SELECT email FROM user_subscriptions WHERE subscription IS NOT NULL GROUP BY email;';
        $stmt = $this->pdo->prepare($sql);

        $stmt->execute();

        $users = [];
        while($item = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            array_push($users, $item['email']);
        }

        return $users;
    }

    public function get_subscriptions_for_user($email) {
        $sql = 'SELECT email, subscription FROM user_subscriptions WHERE subscription IS NOT NULL;';
        $stmt = $this->pdo->prepare($sql);

        $stmt->execute();

        $subscriptions = [];
        while($item = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (!!$item['subscription']) {
                $item['subscription'] = json_decode($item['subscription'], true);
            }

            array_push($subscriptions, $item);
        }

        return $subscriptions;

    }

    public function delete($deviceId) {
        $sql = 'DELETE FROM user_subscriptions WHERE deviceId=:deviceId;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':deviceId' => $deviceId]);

        $sql = 'SELECT * FROM user_subscriptions WHERE deviceId=:deviceId;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':deviceId' => $deviceId]);

        return $stmt->fetch(\PDO::FETCH_ASSOC) === false;
    }

    public function delete_all_user($email) {
        $sql = 'DELETE FROM user_subscriptions WHERE email=:email;';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':email' => $email]);
    }

    public function delete_duplicates() {
        $sql = 'DELETE FROM user_subscriptions WHERE rowid NOT IN (SELECT MIN(rowid) FROM user_subscriptions GROUP BY email, deviceId);';
        $this->pdo->exec($sql);
    }

    public function add_unique() {
        $this->delete_duplicates();
        $this->pdo->exec("create unique index ux_user_subscriptions on user_subscriptions(email, deviceId);");
    }
}