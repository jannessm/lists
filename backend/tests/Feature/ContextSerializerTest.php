<?php declare(strict_types=1);

namespace Tests\Feature;

use App\GraphQL\ContextSerializer;
use App\Models\User;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;
use Nuwave\Lighthouse\Support\Contracts\SerializesContext;
use Tests\TestCase;

/**
 * Tests for the custom ContextSerializer that backs the Lighthouse subscription
 * file-cache storage driver.  We set `cache.stores.array.serialize = true` to
 * force the array store to go through the full PHP serialize/unserialize cycle,
 * which replicates what the file-cache driver does in production.
 */
class ContextSerializerTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Enable serialisation on the in-memory array store (mirrors file-cache). */
    private function useSerializingArrayStore(): void
    {
        $config = $this->app->make(ConfigRepository::class);
        $config->set('cache.stores.array.serialize', true);
    }

    private function makeContext(?User $user): GraphQLContext
    {
        $request = new Request();
        if ($user !== null) {
            $request->setUserResolver(fn () => $user);
        }
        return new HttpGraphQLContext($request);
    }

    // -------------------------------------------------------------------------
    // Binding
    // -------------------------------------------------------------------------

    public function test_container_binds_custom_serializer(): void
    {
        $serializer = $this->app->make(SerializesContext::class);

        $this->assertInstanceOf(ContextSerializer::class, $serializer);
    }

    // -------------------------------------------------------------------------
    // Serialize / unserialize with authenticated user
    // -------------------------------------------------------------------------

    public function test_serialized_string_is_valid_json(): void
    {
        $user = User::factory()->create();
        $context = $this->makeContext($user);

        $serializer = $this->app->make(SerializesContext::class);
        $serialized = $serializer->serialize($context);

        $decoded = json_decode($serialized, true);
        $this->assertNotNull($decoded, 'serialize() must return valid JSON');
        $this->assertArrayHasKey('user_id', $decoded);
    }

    public function test_round_trip_preserves_authenticated_user(): void
    {
        $user = User::factory()->create();
        $context = $this->makeContext($user);

        $serializer = $this->app->make(SerializesContext::class);
        $serialized = $serializer->serialize($context);

        $restored = $serializer->unserialize($serialized);

        $this->assertNotNull($restored->user());
        $this->assertSame($user->id, $restored->user()->id);
    }

    public function test_round_trip_with_unauthenticated_context(): void
    {
        $context = $this->makeContext(null);

        $serializer = $this->app->make(SerializesContext::class);
        $serialized = $serializer->serialize($context);

        $restored = $serializer->unserialize($serialized);

        $this->assertNull($restored->user());
    }

    // -------------------------------------------------------------------------
    // Serialising array store (mirrors file-cache driver behaviour)
    // -------------------------------------------------------------------------

    public function test_serialized_payload_survives_cache_store_round_trip(): void
    {
        $this->useSerializingArrayStore();

        $user = User::factory()->create();
        $context = $this->makeContext($user);

        $serializer = $this->app->make(SerializesContext::class);
        $payload    = $serializer->serialize($context);

        // Put/get via cache — exercises the real serialize/unserialize path
        $cache = $this->app->make('cache')->store('array');
        $cache->put('test_ctx', $payload, 60);
        $retrieved = $cache->get('test_ctx');

        $this->assertSame($payload, $retrieved);

        $restored = $serializer->unserialize($retrieved);
        $this->assertSame($user->id, $restored->user()->id);
    }

    public function test_serialized_payload_contains_no_closures_or_resources(): void
    {
        $user = User::factory()->create();
        $context = $this->makeContext($user);

        $serializer = $this->app->make(SerializesContext::class);
        $serialized = $serializer->serialize($context);

        // JSON decode must succeed and the payload contains only the user_id scalar
        $data = json_decode($serialized, true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('user_id', $data);
        $this->assertScalarOrNull($data['user_id']);
    }

    /** Assert that a value is either null or a scalar (int, float, string, bool). */
    private function assertScalarOrNull(mixed $value): void
    {
        $this->assertTrue(
            $value === null || is_scalar($value),
            'user_id must be a scalar or null, got ' . gettype($value),
        );
    }

    // -------------------------------------------------------------------------
    // Deleted / missing user is handled gracefully
    // -------------------------------------------------------------------------

    public function test_unserialize_returns_null_user_when_user_has_been_deleted(): void
    {
        $user = User::factory()->create();
        $userId = $user->id;

        $context = $this->makeContext($user);

        $serializer = $this->app->make(SerializesContext::class);
        $serialized = $serializer->serialize($context);

        // Delete the user before restoring
        $user->delete();

        $restored = $serializer->unserialize($serialized);
        $this->assertNull($restored->user());
    }

    // -------------------------------------------------------------------------
    // Context returned implements GraphQLContext
    // -------------------------------------------------------------------------

    public function test_unserialized_context_implements_graphql_context(): void
    {
        $user = User::factory()->create();
        $context = $this->makeContext($user);

        $serializer = $this->app->make(SerializesContext::class);
        $serialized = $serializer->serialize($context);
        $restored   = $serializer->unserialize($serialized);

        $this->assertInstanceOf(GraphQLContext::class, $restored);
    }
}
