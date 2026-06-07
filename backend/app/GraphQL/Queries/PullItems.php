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
        $updatedAt = $updatedAt->toISOString();

        if (!array_key_exists('id', $args)) {
            $id = '';
        } else {
            $id = $args['id'];
        }

        // Build a single query that properly handles pagination
        $items = $user->listItems()
            ->where(function ($query) use ($updatedAt, $id) {
                $query->where('updated_at', '>', $updatedAt)
                      ->orWhere(function ($query) use ($updatedAt, $id) {
                          $query->where('updated_at', '=', $updatedAt)
                                ->where('id', '>', $id);
                      });
            })
            ->orderBy('updated_at')
            ->orderBy('id')
            ->limit($args["limit"])
            ->get()
            ->all();
        
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
