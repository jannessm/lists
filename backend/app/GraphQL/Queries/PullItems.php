<?php declare(strict_types=1);

namespace App\GraphQL\Queries;


use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Builder;

use App\Models\ListItem;

final class PullItems
{
    /**
     * @param  null  $_
     * @param  array{}  $args
     */
    public function __invoke($_, array $args)
    {
        $user = Auth::user();
    
        if (!array_key_exists("updatedAt", $args)) {
            $updatedAt = Carbon::createFromTimestampUTC(-1);
        } else {
            $updatedAt = $args['updatedAt'];
        }
        $updatedAt = $updatedAt->toDateTimeString();

        if (!array_key_exists('id', $args)) {
            $id = '';
        } else {
            $id = $args['id'];
        }

        $newItems = $user->listItems()
            ->where("updated_at", ">", $updatedAt)
            ->limit($args["limit"])->get();
        $sameItems = $user->listItems()
            ->where("updated_at", $updatedAt)
            ->where("id", ">", $id)
            ->limit($args["limit"])->get();
        $items = $newItems->merge($sameItems)
            ->sortBy('updated_at')
            ->sortBy('id')
            ->slice(0, $args["limit"])->all();
        
        $last_item = end($items);
        $result = [
            "documents" => $items,
            "checkpoint" => null
        ];
        
        if (!!$last_item) {
            $result["checkpoint"] = [
                "id" => $last_item->id,
                "updatedAt" => $last_item->updated_at
            ];
        } else {
            $result["checkpoint"] = [
                "id" => $id,
                "updatedAt" => $updatedAt
            ];
        }

        return $result;
    }
}
