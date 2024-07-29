<?php declare(strict_types=1);

namespace App\GraphQL\Subscriptions;

final class StreamLists extends StreamAuthorize
{

    public function hasAccess(mixed $rootItem, string $userId) {
        return $rootItem->users()->search(function ($val) use ($userId) {
            return $val->id === $userId;
        });
    }

    public function filterRoot(mixed $root, string $userId) {
        return array_filter($root, function ($item) use ($userId) {
            // search return index or false => return false if false was returned
            return $item->users()->search(function ($val) use ($userId) {
                return $val->id === $userId;
            }) !== false;
        });
    }
}
