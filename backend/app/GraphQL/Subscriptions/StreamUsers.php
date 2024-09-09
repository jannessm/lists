<?php declare(strict_types=1);

namespace App\GraphQL\Subscriptions;

use Illuminate\Support\Facades\Auth;

use App\Models\User;

final class StreamUsers extends StreamAuthorize
{

    public function hasAccess(mixed $rootItem, string $userId) {
        return $rootItem->friends()->search(function ($val) {
            return $val->id === $userId;
        }) !== false;
    }

    public function filterRoot(mixed $root, string $userId) {
        return array_filter($root, function ($item) use ($userId) {
            // search return index or false => return false if false was returned
            return $item->friends()->search(function ($val) use ($userId) {
                return $val->id === $userId;
            }) !== false && $item !== $userId;
        });
    }
}
