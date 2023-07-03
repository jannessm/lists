<html>
<body>
<style>pre {

font-family: monospace;

}</style>
<pre>
<?php

$BASE = './';

require_once('src/jwt.php');
require_once('src/messages.php');
require_once('src/sqlite_conn.php');
require_once('src/user.php');
require_once('src/lists.php');
require_once('src/user_list_relation.php');
require_once('src/user_subscriptions.php');
require_once('src/list_item.php');
require_once('src/manage_user.php');
require_once('src/manage_lists.php');
require_once('src/manage_list_items.php');

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

$sqlconn = new SQLiteConnection();
$PDO = $sqlconn->connect();

$USER_SUBSCRIPTIONS = new UserSubscriptions($PDO);
$LIST_ITEMS = new ListItems($PDO);

$notified_list_items = [];

$webPush = new WebPush([
    "VAPID" => [
        "subject" => "http://localhost:8080",
        "publicKey" => $vapidPublicKey,
        "privateKey" => $vapidPrivateKey
    ]
]);

foreach($USER_SUBSCRIPTIONS->get_subscribed_users() as $user) {
    
    foreach($LIST_ITEMS->get_all_in_due($user) as $list_item) {
        $notifications = [];

        foreach($USER_SUBSCRIPTIONS->get_subscriptions_for_user($user) as $subscription) {
            $webPush->queueNotification(
                Subscription::create($subscription['subscription']),
                json_encode(["notification" => [
                    "title" => "Erinnerung",
                    "body" => $list_item['name'],
                    "icon" => "assets/icons/Icon-256.png",
                    "vibrate" => [100, 50, 100],
                    "timestamp" => (new DateTime())->getTimestamp(),
                    "data" => [
                        "onActionClick" => [
                            "default" => [
                                "operation" => "navigateLastFocusedOrOpen",
                                "url" => "http://localhost:4200/user/list/" . $list_item['list_id'] . '#uuid-' . $list_item['uuid']
                            ]
                        ]
                    ]
                ]])
            );
        }
        
        /**
         * Check sent results
         * @var MessageSentReport $report
         */
        foreach ($webPush->flush() as $report) {
            $endpoint = $report->getRequest()->getUri()->__toString();
        
            if ($report->isSuccess()) {
                echo "[v] Message sent successfully for subscription {$endpoint}.\n";
                array_push($notified_list_items, $list_item);
            } else {
                echo "[x] Message failed to sent for subscription {$endpoint}: {$report->getReason()} \n";
            }
        }
    }
}

foreach($notified_list_items as $item) {
    $item['remind'] = false;
    $LIST_ITEMS->update($item);
}

?>
</pre>
</body>
</html>