<?php

namespace App;

use Illuminate\Support\Arr;

class GroceryCategories {
    // [category] = items[]
    public $categories = [];
    private $equalBonus = 10000;


    public function __construct() {
        $this->categories = $this->readCategories();
    }

    public function categorize(String $input): String {
        $tokens = $this->tokenize($input);
        return $this->getCategory($tokens);
    }

    /**
     * load all categories and return key (category) => value (list of items in category)
     */
    private function readCategories() {
        $handle = fopen(resource_path('') . '/grocery_categories.tsv', 'rb');
        $f = [];
        while (!feof($handle)) {
            $f[] = fgets($handle);
        }
        
        // read categories
        $data = [];
        $header = array_map("trim", str_getcsv($f[0], "\t"));
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

        return $data;
    }

    private function tokenize(String $input) {
        // remove weights and amounts
        $input = trim(preg_replace("/\d+\S*/", "", $input));
        // remove umlaute etc
        $input = transliterator_transliterate('Any-Latin; Latin-ASCII; [\u0080-\u7fff] remove', $input);
        // remove brackets
        $input = trim(preg_replace("/[\(\[{].*[\)\]}]/", "", $input));
        
        // split words
        $tokens = explode(' ', $input);
        
        $tokens = array_map('trim', $tokens); // remove whitespaces
        $tokens = Arr::flatten($tokens);
        return array_filter($tokens);
    }

    private function getCategory(array $tokens) {
        $maxVotes = -1;
        $maxCategory = null;
        foreach($this->categories as $category => $items) {
            $votes = $this->voteForCategory($tokens, $items);
            if ($votes > $maxVotes) {
                $maxVotes = $votes;
                $maxCategory = $category;
            }
        }
        
        return $maxCategory;
    }

    private function voteForCategory(array $tokens, array $items) {
        $votes = 0;
        foreach($items as $item) {
            foreach($tokens as $token) {
                $offset = strpos($item, $token) + 1;
                $weight = $offset > 0 ? strlen($item) : 0;
                $weight += $token === $item ? $this->equalBonus : 0;
                $votes += $offset + $weight;
            }
        }

        return $votes;
    }
}