<?php declare(strict_types=1);

namespace App\GraphQL\Subscriptions;

use Illuminate\Http\Request;
use Nuwave\Lighthouse\Execution\ResolveInfo;
use Nuwave\Lighthouse\Subscriptions\Subscriber;
use Nuwave\Lighthouse\Schema\Types\GraphQLSubscription;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

final class StreamItems extends StreamAuthorize
{
    
    public function hasAccess(mixed $rootItem, string $userId) {
        return $rootItem->lists()->users()->search(function ($user) {
            return $user->id == $userId;
        });
    }

    public function filterRoot(mixed $root, string $userId) {
        return array_filter($root, function ($item) use ($userId) {
            return !!($item->lists()->users()->search(function ($val) use ($userId) {
                return $val->id == $userId;
            }));
        });
    }
}
