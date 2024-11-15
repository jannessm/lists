<?php

namespace Tests\Unit\app\Models\ListItem;

use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestWith;

use App\Models\ListItem;

class SplitNameTest extends TestCase
{
    #[Test]
    #[TestWith([""])]
    #[TestWith(["test"])]
    #[TestWith(["01234567890123456789012345678901234567890123456789"])]
    public function smaller_than_50_does_nothing(String $name): void
    {
        $state = ['name' => $name, 'description' => ''];
        ListItem::splitName($state);
        $this->assertEquals($state['name'], $name);
        $this->assertEquals($state['description'], '');
    }

    #[Test]
    #[TestWith(["012345678901234567890123456789012345678901234567891"])]
    public function moves_first_element_to_description_if_too_long(String $name): void
    {
        $state = ['name' => $name, 'description' => ''];
        $state = ListItem::splitName($state);
        $this->assertEquals($state['name'], '');
        $this->assertEquals($state['description'], $name);
    }

    #[Test]
    #[TestWith(["https://test.com", "test.com"])]
    public function moves_url_to_description_even_if_too_short(String $name, String $newName): void
    {
        $state = ['name' => $name, 'description' => ''];
        $state = ListItem::splitName($state);
        $this->assertEquals($state['name'], $newName);
        $this->assertEquals($state['description'], $name);
    }

    #[Test]
    #[TestWith(["a test https://test.com", "a test", "https://test.com"])]
    public function moves_url_to_description_without_adding_host_to_name(
        String $name, String $newName, String $newDescription
    ): void
    {
        $state = ['name' => $name, 'description' => ''];
        $state = ListItem::splitName($state);
        $this->assertEquals($state['name'], $newName);
        $this->assertEquals($state['description'], $newDescription);
    }

    #[Test]
    #[TestWith(["0123456789012345678901234567890123456789 0123456789", "a test", "0123456789012345678901234567890123456789", "0123456789\n\na test"])]
    public function adds_old_description_at_the_bottom(
        String $name, String $description, String $newName, String $newDescription
    ): void
    {
        $state = ['name' => $name, 'description' => $description];
        $state = ListItem::splitName($state);
        $this->assertEquals($state['name'], $newName);
        $this->assertEquals($state['description'], $newDescription);
    }

    #[Test]
    #[TestWith(["", "a test", "", "a test"])]
    public function does_nothing_with_only_description_given(
        String $name, String $description, String $newName, String $newDescription
    ): void
    {
        $state = ['name' => $name, 'description' => $description];
        $state = ListItem::splitName($state);
        $this->assertEquals($state['name'], $newName);
        $this->assertEquals($state['description'], $newDescription);
    }
}
