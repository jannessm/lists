<?php

namespace App\Models;

enum ReminderIntervals: string {
    case DUE = "0 min";
    case MIN_10 = "10 min";
    case MIN_30 = "30 min";
    case H_1 = "1 h";
    case D_1 = "1 d";
};