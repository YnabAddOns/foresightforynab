<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'ziggy' => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'ynabAuthorizationUrl' => $this->getYnabAuthorizationUrl(),
            'ynabAccessToken' => $request->cookie('ynab_access_token'),
            'cookieConsent' => (bool) Cookie::get('cookie_consent'),
            'ynabReferralLink' => config('services.ynab.referral_link'),
            'supportEmail' => config('app.support_email'),
            'privacyPolicyVersion' => config('privacy.current_version'),
            'privacyPolicyChangeDate' => config('privacy.last_change_date'),
            'privacyPolicyChangeDescription' => config('privacy.change_description'),
            'curatedIntegrationsLink' => config('services.ynab.curated_integrations_link'),
            'roadmapUrl' => config('app.roadmap_url'),
        ];
    }

    private function getYnabAuthorizationUrl(): string
    {
        $query = http_build_query([
            'client_id' => config('services.ynab.client_id'),
            'redirect_uri' => config('services.ynab.redirect_uri'),
            'response_type' => 'token',
        ]);

        return "https://app.ynab.com/oauth/authorize?$query";
    }
}
