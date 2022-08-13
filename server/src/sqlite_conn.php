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

    private $backup_max = 10;

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

    public function backup() {
        // skip if localhost
        if(in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1'])) {
            return;
        }
        
        global $sqliteFile, $LISTS, $LIST_ITEMS, $USER_LIST;
        if ($this->pdo) {
            $today = (new DateTime())->format('Y-m-d');

            // get all past backup files
            $backup_files = scandir(dirname($sqliteFile));
            $backup_files = array_filter($backup_files, fn($file) => str_starts_with($file, $sqliteFile));

            $last_backups = array_filter(
                array_map(fn($file) => substr($file, -10), $backup_files),
                fn($file) => !str_starts_with($file, $sqliteFile)
            );

            rsort($last_backups);
            
            for ($i = $this->backup_max; $i < count($last_backups); $i++) {
                unlink($sqliteFile . '.bkp-' . $last_backups[$i]);
            }

            $backup_files = array_filter($backup_files, fn($file) => str_ends_with($file, $today));
            
            if (count($backup_files) === 0) {
                // clean up database
                $LISTS->delete_all_not_present_in_user_list();
                $LIST_ITEMS->delete_all_without_list();
                $USER_LIST->delete_duplicates();
                
                $new_backup = new SQLite3($sqliteFile . '.bkp-' . (new DateTime())->format('Y-m-d'));
                $conn = new SQLite3($sqliteFile);
                $conn->backup($new_backup);
            }
        }
    }

}