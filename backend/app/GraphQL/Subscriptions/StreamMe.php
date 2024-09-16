<?php declare(strict_types=1);

namespace App\GraphQL\Subscriptions;

final class StreamMe extends StreamAuthorize
{

    public function hasAccess(mixed $rootItem, string $userId) {
        return $rootItem->id === $userId;
    }

    public function filterRoot(mixed $root, string $userId) {
        foreach($root as $item) {
            if ($item->id === $userId) {
                return [$item];
            }
        }

        return [];
    }
}
