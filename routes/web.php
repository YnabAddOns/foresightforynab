<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', static function (Request $request) {
    if ($request->get('cookie_consent')) {
        Cookie::queue('cookie_consent', $request->get('cookie_consent'), 60 * 24 * 30);

        return to_route('home');
    }

    return Inertia::render('Welcome');
})->name('home');

Route::post('/access-token', static function (Request $request) {
    $accessToken = $request->get('access_token');

    if ($accessToken) {
        Cookie::queue('ynab_access_token', $accessToken, 60 * 24 * 30);
    }
})->name('access-token');

Route::get('/repeating', static function (Request $request) {
    $noCookieConsent = ! Cookie::get('cookie_consent');

    if ($noCookieConsent) {
        return to_route('home');
    }

    return Inertia::render('Repeating');
})->name('repeating');

Route::get('/payee/{payee}', static function (string $payee) {
    return Inertia::render('Payee', compact('payee'));
})->name('payee');

Route::inertia('/privacy', 'Privacy')->name('privacy');

Route::inertia('/about', 'About')->name('about');
