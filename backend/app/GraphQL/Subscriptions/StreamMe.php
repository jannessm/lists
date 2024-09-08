<?php declare(strict_types=1);

namespace App\GraphQL\Subscriptions;

use Nuwave\Lighthouse\Execution\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

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
    
    /** Restructure response */
    public function resolve(mixed $root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): mixed {
        // Optionally manipulate the `$root` item before it gets broadcasted to
        // subscribed client(s).
        if (!is_array($root)) {
            $root = [$root];
        }

        $checkpointUpdatedAt = end($root)['updated_at'];

        return [
            "documents" => $root,
            "checkpoint" => [
                "updatedAt" => $checkpointUpdatedAt
            ]
        ];
    }
}
