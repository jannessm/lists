<?php

namespace Tests\Unit\app;

use Tests\CreatesApplication;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestWith;

use App\GroceryCategories;

class GroceryCategoriesTest extends TestCase {
    use CreatesApplication;

    protected $groceryCategories;

    protected function setUp(): void {
        $this->createApplication();
        $this->groceryCategories = new GroceryCategories();
    }
    
    #[Test]
    #[TestWith(["500g reis", ["reis"]])]
    #[TestWith(["reis 500g", ["reis"]])]
    #[TestWith(["3 tomaten", ["tomaten"]])]
    #[TestWith(["500 kg tomaten", ["kg", "tomaten"]])]
    #[TestWith(["500 kg tomaten 123", ["kg", "tomaten"]])]
    public function remove_weights_and_amounts(String $input, Array $correctTokens): void {
        $refl = new \ReflectionClass(get_class($this->groceryCategories));
        $tokenize = $refl->getMethod("tokenize");
        
        $tokens = $tokenize->invokeArgs($this->groceryCategories, [$input]);

        $this->assertEqualsCanonicalizing($tokens, $correctTokens);
    }

    #[Test]
    #[TestWith(["äpfel", ["apfel"]])]
    #[TestWith(["apfel", ["apfel"]])]
    #[TestWith(["üei", ["uei"]])]
    #[TestWith(["Saußen", ["Saussen"]])]
    #[TestWith(["Ètwás auf çheciscñ", ["Etwas", "auf", "checiscn"]])]
    public function remove_non_ascii(String $input, Array $correctTokens): void {
        $refl = new \ReflectionClass(get_class($this->groceryCategories));
        $tokenize = $refl->getMethod("tokenize");
        
        $tokens = $tokenize->invokeArgs($this->groceryCategories, [$input]);

        $this->assertEqualsCanonicalizing($tokens, $correctTokens);
    }

    #[Test]
    #[TestWith(["etwas tolles (oder so)", ["etwas", "tolles"]])]
    #[TestWith(["alles (ohne (klammern))", ["alles"]])]
    #[TestWith(["[ohne (eckige)] klammern", ["klammern"]])]
    #[TestWith(["und {ohne } geschweifte", ["und", "geschweifte"]])]
    public function remove_brackets(String $input, Array $correctTokens): void {
        $refl = new \ReflectionClass(get_class($this->groceryCategories));
        $tokenize = $refl->getMethod("tokenize");
        
        $tokens = $tokenize->invokeArgs($this->groceryCategories, [$input]);

        $this->assertEqualsCanonicalizing($tokens, $correctTokens);
    }

    #[Test]
    #[TestWith(["eis", "Tiefkühlung"])]
    #[TestWith(["reis", "Vorratskammer"])]
    public function categorize_correctly(String $input, String $correctCategory): void {
        $category = $this->groceryCategories->categorize($input);

        $this->assertEquals($category, $correctCategory);
    }
}