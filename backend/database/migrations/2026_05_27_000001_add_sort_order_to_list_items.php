<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('list_items', function (Blueprint $table) {
            if (!Schema::hasColumn('list_items', 'sort_order')) {
                $table->double('sort_order')->nullable(false)->default(0)->after('_deleted');
            }
            if (!collect(Schema::getIndexes('list_items'))->contains(fn($idx) => $idx['name'] === 'list_items_lists_id_sort_order_index')) {
                $table->index(['lists_id', 'sort_order']);
            }
        });

        // Backfill existing rows with sequential sort_order values per list
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite does not support window functions before 3.25 but
            // Laravel's testing SQLite is modern enough. Use a subquery instead.
            DB::statement('
                UPDATE list_items
                SET sort_order = (
                    SELECT COUNT(*)
                    FROM list_items AS li2
                    WHERE li2.lists_id = list_items.lists_id
                      AND (li2.created_at < list_items.created_at
                        OR (li2.created_at = list_items.created_at AND li2.id <= list_items.id))
                )
            ');
        } else {
            // MySQL requires UPDATE ... JOIN syntax instead of UPDATE ... FROM
            DB::statement('
                UPDATE list_items
                JOIN (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY lists_id ORDER BY created_at) AS rn
                    FROM list_items
                ) AS subq ON list_items.id = subq.id
                SET list_items.sort_order = subq.rn
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('list_items', function (Blueprint $table) {
            $table->dropIndex(['lists_id', 'sort_order']);
            $table->dropColumn('sort_order');
        });
    }
};
