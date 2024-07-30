<?php declare(strict_types=1);

namespace App\GraphQL\Subscriptions;

final class StreamItems extends StreamAuthorize
{
    
    public function hasAccess(mixed $rootItem, string $userId) {
        return $rootItem
            ->lists
            ->users()
            ->search(function ($user) use ($userId) {
                return $user->id === $userId;
            }) !== false;
    }

    public function filterRoot(mixed $root, string $userId) {
        return array_filter($root, function ($item) use ($userId) {
            // search return index or false => return false if false was returned
            return $item
                ->lists
                ->users()
                ->search(function ($val) use ($userId) {
                    return $val->id === $userId;
                }) !== false;
        });
    }
}
