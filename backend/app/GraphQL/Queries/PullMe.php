<?php declare(strict_types=1);

namespace App\GraphQL\Queries;


use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Builder;

final class PullMe
{
    /**
     * @param  null  $_
     * @param  array{}  $args
     */
    public function __invoke($_, array $args)
    {
        if (!array_key_exists("updatedAt", $args)) {
            $updatedAt = Carbon::createFromTimestampUTC(-1);
        } else {
            $updatedAt = $args['updatedAt'];
        }
        $updatedAt = $updatedAt->toISOString();

        $users = \App\Models\User::orderBy('updated_at')
            ->where([
                ["id", "=", Auth::id()],
                ["updated_at", ">", $updatedAt]
            ])
            ->limit($args["limit"])
            ->get()->all();

        $last_user = end($users);
        $result = [
            "documents" => $users,
            "checkpoint" => null
        ];
        
        if (!!$last_user) {
            $result["checkpoint"] = [   
                "updatedAt" => $last_user->updated_at
            ];
        } else {
            $result["checkpoint"] = [
                "updatedAt" => $args["updatedAt"]
            ];
        }

        return $result;
    }
}
