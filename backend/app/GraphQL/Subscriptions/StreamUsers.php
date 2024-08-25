<?php declare(strict_types=1);

namespace App\GraphQL\Subscriptions;

use Illuminate\Support\Facades\Auth;

final class StreamUsers extends StreamAuthorize
{

    public function hasAccess(mixed $rootItem, string $userId) {
        $me = Auth::user();
        return $me->friends()->search(function ($val) {
            return $val->id === $rootItem->id;
        }) !== false;
    }

    public function filterRoot(mixed $root, string $userId) {
        $me = Auth::user();
        return array_filter($root, function ($item) {
            // search return index or false => return false if false was returned
            return $me->friends()->search(function ($val) {
                return $val->id === $item->id;
            }) !== false;
        });
    }
}
