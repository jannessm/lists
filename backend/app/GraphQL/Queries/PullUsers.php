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

        $users = \App\Models\User::orderBy('updated_at')
            ->orderBy('id')
            ->where("updated_at", ">", $updatedAt)
            ->orWhere(function (Builder $query) use ($id, $updatedAt) {
                $query->where([
                    ["updated_at", "=", $updatedAt],
                    ["id", ">", $id]
                ]);
            })
            ->limit($args["limit"])
            ->get()->all();
        
        $last_user = end($users);
        $result = [
            "documents" => $users,
            "checkpoint" => null
        ];
        
        if (!!$last_user) {
            $result["checkpoint"] = [
                "id" => $last_user->id,
                "updatedAt" => $last_user->updated_at
            ];
        } else {
            $result["checkpoint"] = [
                "id" => $args["id"],
                "updatedAt" => $args["updatedAt"]
            ];
        }

        return $result;
    }
}
