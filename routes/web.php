<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', static function (Request $request) {
    $accessToken = $request->get('access_token');

    if ($accessToken) {
        Cookie::queue('ynab_access_token', $accessToken);

        return to_route('home');
    }

    return Inertia::render('Welcome');
})->name('home');

Route::inertia('/repeating', 'Repeating')->name('repeating');

Route::get('/payee/{payee}', static function (string $payee) {
    return Inertia::render('Payee', compact('payee'));
})->name('payee');

Route::inertia('/privacy', 'Privacy')->name('privacy');

Route::inertia('/about', 'About')->name('about');
