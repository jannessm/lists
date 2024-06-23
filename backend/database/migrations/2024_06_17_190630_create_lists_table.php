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
        Schema::create('lists', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name')->nullable(false);
            $table->boolean('is_shopping_list')->default(false);
            $table->foreignUlid('created_by')->references('id')->on('users')->nullable(false);
            $table->timestamps();
            $table->boolean('_deleted')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lists');
    }
};
