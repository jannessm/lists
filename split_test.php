<?php

$test = 'https://www.amazon.de/Generation-Anthrazit-Sengled-Smart-Funktionert/dp/B0D4ZHD53V/?_encoding=UTF8&pd_rd_w=cNyJ2&content-id=amzn1.sym.b74297bf-6149-48d9-8e15-2abe78663a53&pf_rd_p=b74297bf-6149-48d9-8e15-2abe78663a53&pf_rd_r=QRDMMSHZ5N410NT9Q864&pd_rd_wg=Sz7XZ&pd_rd_r=ed2660a9-110a-4bf9-a679-523b6693652d&ref_=pd_hp_d_atf_unk';
$newState = ['name' => $test, 'description' => 'test'];

var_dump(parse_url('https://test.com'));

var_dump($newState);