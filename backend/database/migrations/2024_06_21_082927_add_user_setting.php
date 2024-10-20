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
        Schema::table('users', function (Blueprint $table) {
            $table->string('theme')
                ->after('password')
                ->default('auto');
            $table->foreignUlid('default_list')->nullable()->references('id')->on('lists');
            $table->string('default_reminder')->default();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'theme',
                'default_list',
                'receive_web_push',
                'receive_web_push_lists_changed',
                'receive_web_push_reminder',
            ]);
        });
    }
};
