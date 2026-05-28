<?php declare(strict_types=1);

namespace App\GraphQL;

use App\Models\User;
use Illuminate\Http\Request;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use Nuwave\Lighthouse\Support\Contracts\SerializesContext;

/**
 * Stores only the authenticated user's ID so that the file-based subscription
 * storage driver never encounters non-serialisable objects (closures, PDO
 * connections, etc.) that can live inside a full Request attributes bag.
 */
class ContextSerializer implements SerializesContext
{
    public function serialize(GraphQLContext $context): string
    {
        $user = $context->user();

        return serialize([
            'user_id' => $user?->getAuthIdentifier(),
        ]);
    }

    public function unserialize(string $context): GraphQLContext
    {
        /** @var array{user_id: mixed} $data */
        $data = unserialize($context);

        $request = new Request();

        if ($data['user_id'] !== null) {
            $user = User::find($data['user_id']);
            $request->setUserResolver(fn () => $user);
        }

        return new HttpGraphQLContext($request);
    }
}
