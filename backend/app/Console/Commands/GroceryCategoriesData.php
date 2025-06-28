<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Models\Lists;
use App\GroceryCategories;

class GroceryCategoriesData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stats:grocery-categories-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a .csv containg all grocery items and their current category';

    /**
     * Execute the console command.
     */
    public function handle() {
        $items = $this->getItemCategories();

        // Check if items are found
        if (empty($items)) {
            $this->info('No items found for shopping lists.');
            return;
        }
        
        // get categories and dump to .csv
        $this->writeItemsToCsv($items);
    }

    public function getItemCategories() {
        $categorizer = new GroceryCategories();

        // Fetch all lists where is_shopping_list is true
        $shoppingLists = Lists::where('is_shopping_list', true)
                              ->where(function ($query) {
                                  $query->where('_deleted', false)
                                        ->orWhere('_deleted', true);
                              })
                              ->get();

        // Initialize an array to hold the items
        $items = [];

        // Loop through each shopping list and get associated items
        foreach ($shoppingLists as $list) {
            $items = array_merge($items, $list->items->toArray());
        }

        $itemCategories = [];
        // Loop through each item and call the categories method
        foreach ($items as $item) {
            // Assuming the item is an instance of the Item model
            $category = $categorizer->categorize($item['name']);
            array_push($itemCategories, [$item['name'], $category]);
        }

        return $itemCategories;
    }

    public function getOthersItems() {
        $items = $this->getItemCategories();
        $items = array_filter($items, function ($entry) {
            return $entry[1] === "Other";
        });
        return array_map(function ($entry) {
            return $entry[0];
        }, $items);
    }

    protected function writeItemsToCsv(array $itemCategories) {
        // Define the CSV file path
        $csvFilePath = storage_path('app/categorized_shopping_list_items.csv');

        // Open the file for writing
        $file = fopen($csvFilePath, 'w');

        // Write the header row
        fputcsv($file, ['Item Name', 'Category']);

        // Loop through each item and call the categories method
        foreach ($itemCategories as $entry) {
            fputcsv($file, $entry); // Write item name and category to CSV
        }

        // Close the file
        fclose($file);

        $this->info("Items have been written to {$csvFilePath}");
    }
}
