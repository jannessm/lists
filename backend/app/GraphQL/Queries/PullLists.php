<?php declare(strict_types=1);

namespace App\GraphQL\Queries;


use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Builder;

use App\Models\Lists;

final class PullLists
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

        $lists = $user->lists()->sortBy('updated_at')->sortBy('id');

        $filteredLists = $lists->where("updated_at", ">", $updatedAt)
            ->merge(
                $lists->where("updated_at", $updatedAt)
                    ->where("id", ">", $id)
            )
            ->slice(0, $args["limit"])
            ->all();
        
        $last_list = end($filteredLists);
        $result = [
            "documents" => $filteredLists,
            "checkpoint" => null
        ];
        
        if (!!$last_list) {
            $result["checkpoint"] = [
                "id" => $last_list->id,
                "updatedAt" => $last_list->updated_at
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
