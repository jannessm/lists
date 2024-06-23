<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('list_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name')->nullable(false);
            $table->text('description')->nullable(true);
            $table->timestamp('reminder')->nullable(true);
            $table->timestamp('due')->nullable(true);
            $table->foreignUlid('created_by')->references('id')->on('users')->nullable(false);
            $table->foreignUlid('lists_id')->nullable(false)->cascadeOnDelete();
            $table->boolean('done')->default(false);
            $table->timestamps();
            $table->boolean('_deleted')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('list_items');
    }
};
