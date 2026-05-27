<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Lists;
use App\Models\ListItem;

class SortOrderTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function authenticatedUser(): User
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        return $user;
    }

    private function createListForUser(User $user): Lists
    {
        $list = Lists::factory()->create(['created_by' => $user->id]);
        $list->users()->attach($user->id);
        return $list;
    }

    private function graphql(string $query, array $variables = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/graphql', [
            'query'     => $query,
            'variables' => $variables,
        ]);
    }

    // -------------------------------------------------------------------------
    // Migration / schema tests
    // -------------------------------------------------------------------------

    public function test_list_items_table_has_sort_order_column(): void
    {
        $user = $this->authenticatedUser();
        $list = $this->createListForUser($user);

        $item = ListItem::create([
            'name'       => 'test item',
            'lists_id'   => $list->id,
            'created_by' => $user->id,
            'timezone'   => 'UTC',
            'sort_order' => 3.14,
        ]);

        $this->assertDatabaseHas('list_items', [
            'id'         => $item->id,
            'sort_order' => 3.14,
        ]);
    }

    public function test_sort_order_defaults_to_zero(): void
    {
        $user = $this->authenticatedUser();
        $list = $this->createListForUser($user);

        $item = ListItem::create([
            'name'       => 'default sort',
            'lists_id'   => $list->id,
            'created_by' => $user->id,
            'timezone'   => 'UTC',
        ]);

        $this->assertDatabaseHas('list_items', [
            'id'         => $item->id,
            'sort_order' => 0,
        ]);
    }

    // -------------------------------------------------------------------------
    // GraphQL pull — sort_order is returned
    // -------------------------------------------------------------------------

    public function test_pull_items_returns_sort_order(): void
    {
        $user = $this->authenticatedUser();
        $list = $this->createListForUser($user);

        ListItem::create([
            'name'       => 'item with sort',
            'lists_id'   => $list->id,
            'created_by' => $user->id,
            'timezone'   => 'UTC',
            'sort_order' => 5.0,
        ]);

        $response = $this->graphql('
            query PullItems($limit: Int!) {
                pullItems(limit: $limit) {
                    documents {
                        id
                        name
                        sort_order
                    }
                    checkpoint { id updatedAt }
                }
            }
        ', ['limit' => 10]);

        $response->assertOk();
        $data = $response->json('data.pullItems.documents');
        $this->assertNotEmpty($data);

        $item = collect($data)->firstWhere('name', 'item with sort');
        $this->assertNotNull($item);
        $this->assertEquals(5.0, $item['sort_order']);
    }

    // -------------------------------------------------------------------------
    // GraphQL push — sort_order is persisted
    // -------------------------------------------------------------------------

    public function test_push_items_persists_sort_order(): void
    {
        $user = $this->authenticatedUser();
        $list = $this->createListForUser($user);

        $itemId = strtolower(\Illuminate\Support\Str::ulid());

        $response = $this->graphql('
            mutation PushItems($rows: [ItemsInputPushRow!]) {
                pushItems(rows: $rows) {
                    id
                    sort_order
                }
            }
        ', [
            'rows' => [[
                'newDocumentState' => [
                    'id'         => $itemId,
                    'name'       => 'pushed item',
                    'done'       => false,
                    'timezone'   => 'UTC',
                    'createdBy'  => ['id' => $user->id],
                    'lists'      => ['id' => $list->id],
                    '_deleted'   => false,
                    'sort_order' => 7.5,
                ],
            ]],
        ]);

        $response->assertOk();
        // Push should return an empty conflicts array (no conflicts)
        $conflicts = $response->json('data.pushItems');
        $this->assertEmpty($conflicts);

        $this->assertDatabaseHas('list_items', [
            'id'         => $itemId,
            'sort_order' => 7.5,
        ]);
    }

    public function test_push_items_uses_default_sort_order_when_omitted(): void
    {
        $user = $this->authenticatedUser();
        $list = $this->createListForUser($user);

        $itemId = strtolower(\Illuminate\Support\Str::ulid());

        $response = $this->graphql('
            mutation PushItems($rows: [ItemsInputPushRow!]) {
                pushItems(rows: $rows) {
                    id
                }
            }
        ', [
            'rows' => [[
                'newDocumentState' => [
                    'id'       => $itemId,
                    'name'     => 'no sort order',
                    'done'     => false,
                    'timezone' => 'UTC',
                    'createdBy'=> ['id' => $user->id],
                    'lists'    => ['id' => $list->id],
                    '_deleted' => false,
                ],
            ]],
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('list_items', [
            'id'         => $itemId,
            'sort_order' => 0,
        ]);
    }

    // -------------------------------------------------------------------------
    // Conflict detection with sort_order
    // -------------------------------------------------------------------------

    public function test_push_detects_conflict_when_sort_order_changed_on_server(): void
    {
        $user = $this->authenticatedUser();
        $list = $this->createListForUser($user);

        // Create the item directly with sort_order = 1
        $item = ListItem::create([
            'name'       => 'conflict item',
            'lists_id'   => $list->id,
            'created_by' => $user->id,
            'timezone'   => 'UTC',
            'sort_order' => 1.0,
        ]);

        // Client assumes sort_order = 2, but server has 1 → conflict
        $response = $this->graphql('
            mutation PushItems($rows: [ItemsInputPushRow!]) {
                pushItems(rows: $rows) {
                    id
                    sort_order
                }
            }
        ', [
            'rows' => [[
                'assumedMasterState' => [
                    'id'         => $item->id,
                    'name'       => 'conflict item',
                    'done'       => false,
                    'timezone'   => 'UTC',
                    'createdBy'  => ['id' => $user->id],
                    'lists'      => ['id' => $list->id],
                    '_deleted'   => false,
                    'sort_order' => 2.0,   // wrong assumed value
                ],
                'newDocumentState' => [
                    'id'         => $item->id,
                    'name'       => 'conflict item renamed',
                    'done'       => false,
                    'timezone'   => 'UTC',
                    'createdBy'  => ['id' => $user->id],
                    'lists'      => ['id' => $list->id],
                    '_deleted'   => false,
                    'sort_order' => 2.0,
                ],
            ]],
        ]);

        $response->assertOk();
        $conflicts = $response->json('data.pushItems');
        $this->assertNotEmpty($conflicts);
        $this->assertEquals($item->id, $conflicts[0]['id']);
    }
}
