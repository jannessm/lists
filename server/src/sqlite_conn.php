<?php

require_once($BASE . 'config.php');

/**
 * SQLite connnection
 */
class SQLiteConnection {
    /**
     * PDO instance
     * @var type 
     */
    private $pdo;

    /**
     * return in instance of the PDO object that connects to the SQLite database
     * @return \PDO
     */
    public function connect() {
        global $sqliteFile;
        if ($this->pdo == null) {
            try {
                $this->pdo = new \PDO("sqlite:" . $sqliteFile);
            } catch (\PDOException $e) {
                respondErrorMsg(500, "Database not available.");
            }
        }
        return $this->pdo;
    }

}