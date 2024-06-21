<?php declare(strict_types=1);

// namespace App\GraphQL\Queries;


// use Illuminate\Support\Facades\Auth;
// use Illuminate\Support\Carbon;
// use Illuminate\Database\Eloquent\Builder;

// final class PullTasks
// {
//     /**
//      * @param  null  $_
//      * @param  array{}  $args
//      */
//     public function __invoke($_, array $args)
//     {
//         if (array_key_exists("updatedAt", $args)) {
//             $updatedAt = $args['updatedAt'];
//         } else {
//             $updatedAt = Carbon::createFromTimestampUTC(-1);
//         }
//         $updatedAt = $updatedAt->toDateTimeString();

//         if (!array_key_exists('id', $args)) {
//             $id = '';
//         } else {
//             $id = $args['id'];
//         }

//         $tasks = \App\Models\Task::orderBy('updated_at')
//             ->orderBy('id')
//             ->where([
//                 ["user_id", "=", Auth::id()],
//                 ["updated_at", ">", $updatedAt]
//             ])
//             ->orWhere(function (Builder $query) use ($id, $updatedAt) {
//                 $query->where([
//                     ["updated_at", "=", $updatedAt],
//                     ["id", ">", $id]
//                 ]);
//             })
//             ->limit($args["limit"])
//             ->get()->all();
        
//         $last_task = end($tasks);
//         $result = [
//             "documents" => $tasks,
//             "checkpoint" => null
//         ];
        
//         if (!!$last_task) {
//             $result["checkpoint"] = [
//                 "id" => $last_task->id,
//                 "updatedAt" => $last_task->updated_at
//             ];
//         } else {
//             $result["checkpoint"] = [
//                 "id" => $args["id"],
//                 "updatedAt" => $args["updatedAt"]
//             ];
//         }

//         return $result;
//     }
// }
