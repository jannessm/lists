<?php declare(strict_types=1);

namespace App\GraphQL\Subscriptions;

use Illuminate\Http\Request;
use Nuwave\Lighthouse\Execution\ResolveInfo;
use Nuwave\Lighthouse\Subscriptions\Subscriber;
use Nuwave\Lighthouse\Schema\Types\GraphQLSubscription;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

final class StreamTasks extends GraphQLSubscription
{
    /** Check if subscriber is allowed to listen to the subscription. */
    public function authorize(Subscriber $subscriber, Request $request): bool
    {
        // $user = $subscriber->context->user;
        // $user_id = $subscriber->args['user_id'];
        // return $user->id == $user_id;
        return true;
    }

    /** Filter which subscribers should receive the subscription. */
    public function filter(Subscriber $subscriber, mixed $root): bool
    {
        return $subscriber->socket_id !== request()->header('X-Socket-ID');
    }

    /** Restructure response */
    public function resolve(mixed $root, array $args, GraphQLContext $context, ResolveInfo $resolveInfo): mixed {
        // Optionally manipulate the `$root` item before it gets broadcasted to
        // subscribed client(s).
        if (!is_array($root)) {
            $root = [$root];
        }

        $checkpointId = end($root)['id'];
        $checkpointUpdatedAt = end($root)['updated_at'];

        return [
            "documents" => $root,
            "checkpoint" => [
                "id" => $checkpointId,
                "updatedAt" => $checkpointUpdatedAt
            ]
        ];
    }
}
