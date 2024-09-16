<?php declare(strict_types=1);

namespace App\GraphQL\Queries;


use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Builder;

final class PullUsers
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

        $users = $user->friends()->sortBy('updated_at')
            ->sortBy('id');

        $filteredUsers = $users->where("updated_at", ">", $updatedAt)
            ->merge(
                $users->where("updated_at", $updatedAt)
                    ->where("id", ">", $id)
            )
            ->slice(0, $args["limit"])
            ->all();
        
        $last_user = end($filteredUsers);
        $result = [
            "documents" => $filteredUsers,
            "checkpoint" => null
        ];
        
        if (!!$last_user) {
            $result["checkpoint"] = [
                "id" => $last_user->id,
                "updatedAt" => $last_user->updated_at
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
