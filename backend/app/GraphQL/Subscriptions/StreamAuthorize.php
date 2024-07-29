<?php

namespace App\GraphQL\Subscriptions;

use Illuminate\Http\Request;
use Nuwave\Lighthouse\Execution\ResolveInfo;
use Nuwave\Lighthouse\Subscriptions\Subscriber;
use Nuwave\Lighthouse\Schema\Types\GraphQLSubscription;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

abstract class StreamAuthorize extends GraphQLSubscription {

    abstract public function hasAccess(mixed $rootItem, string $userId);
    abstract public function filterRoot(mixed $root, string $userId);

    /** Check if subscriber is allowed to listen to the subscription. */
    public function authorize(Subscriber $subscriber, Request $request): bool
    {
        $user = $subscriber->context->user;
        return !!$user;
    }

    /** Filter which subscribers should receive the subscription. */
    public function filter(Subscriber $subscriber, mixed $root): bool
    {
        // if (!$subscriber->socket_id) {
        //     return false;
        // }
        
        if (!is_array($root)) {
            $root = [$root];
        }

        $hasAccess = false;
        foreach($root as $item) {
            if (!!$this->hasAccess($item, $subscriber->context->user->id)) {
                $hasAccess = true;
                break;
            }
        }
        
        // return $subscriber->socket_id !== request()->header('X-Socket-ID');// && $hasAccess;
        var_dump($subscriber->socket_id, $subscriber->context->user->email, request()->header('X-Socket-ID'));
        return TRUE;
    }

    /** Restructure response */
    public function resolve(mixed $root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): mixed {
        // Optionally manipulate the `$root` item before it gets broadcasted to
        // subscribed client(s).
        if (!is_array($root)) {
            $root = [$root];
        }

        $checkpointID = end($root)['id'];
        $checkpointUpdatedAt = end($root)['updated_at'];

        // filter items to only send "owend" items
        $filteredRoot = $this->filterRoot($root, $context->user->id);

        if (count($filteredRoot) == 0) {
            return [
                "documents" => [],
                "checkpoint" => [
                    "id" => $checkpointID,
                    "updatedAt" => $checkpointUpdatedAt
                ]
            ];
        }

        return [
            "documents" => $filteredRoot,
            "checkpoint" => [
                "id" => $checkpointID,
                "updatedAt" => $checkpointUpdatedAt
            ]
        ];
    }
}