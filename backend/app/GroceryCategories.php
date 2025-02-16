<?php

namespace App;

use Illuminate\Support\Arr;

class GroceryCategories {
    public $categories = [];


    public function __construct() {
        $this->categories = $this->readCategories();
    }

    public function categorize(String $input) {
        $categories = readCategories();
    
        $tokens = tokenize($input);

        $category = null;
        $category_votes = 0;
        // foreach ($categories as $category => $)

        
    }

    private function tokenize(String $input) {
        // remove weights and amounts
        $input = trim(preg_replace("/\d+\S*/", "", $input));
        // remove umlaute etc
        $input = transliterator_transliterate('Any-Latin; Latin-ASCII; [\u0080-\u7fff] remove', $input);
        
        // split words
        $tokens = explode(' ', $input);
        
        $tokens = array_map('trim', $tokens); // remove whitespaces
        $tokens = Arr::flatten($tokens);
        return $tokens;
    }

    
    private function readCategories() {
        $handle = fopen(resource_path('') . '/grocery_categories.tsv', 'rb');
        $f = [];
        while (!feof($handle)) {
            $f[] = fgets($handle);
        }
        
        // read categories
        $header = str_getcsv($f[0], "\t");
        foreach($header as $h) {
            $data[$h] = [];
        }

        array_splice($f, 0, 1);

        foreach ($f as $row) {
            $row = str_getcsv($row, "\t");
            foreach($row as $col => $val) {
                if ($val) {
                    //remove diacritics, trim, lowercase
                    $val = strtolower(trim($val));
                    $regexp = '/&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml|caron);/i';
                    $val = html_entity_decode(preg_replace($regexp, '$1', htmlentities($val)));
                    
                    array_push($data[$header[$col]], $val);
                }
            }
        }
    }
}

function categorize(String $input) {
}