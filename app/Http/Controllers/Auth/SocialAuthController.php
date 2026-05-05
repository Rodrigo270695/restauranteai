<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /** Redirige al proveedor OAuth (Google, etc.) */
    public function redirect(string $provider)
    {
        abort_unless(in_array($provider, ['google']), 404);

        return Socialite::driver($provider)->redirect();
    }

    /** Callback del proveedor — crea o vincula la cuenta */
    public function callback(string $provider)
    {
        abort_unless(in_array($provider, ['google']), 404);

        $socialUser = Socialite::driver($provider)->user();

        $socialAccount = SocialAccount::where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->first();

        if ($socialAccount) {
            // Ya existe — actualiza tokens y autentica
            $socialAccount->update([
                'provider_token'         => $socialUser->token,
                'provider_refresh_token' => $socialUser->refreshToken,
                'avatar'                 => $socialUser->getAvatar(),
            ]);

            $user = $socialAccount->user;
            Auth::login($user, remember: true);

            return $this->redirectAfterSocialLogin($user);
        }

        // Busca si ya existe un usuario con ese email
        $user = User::firstOrCreate(
            ['email' => $socialUser->getEmail()],
            [
                'name'              => $socialUser->getName(),
                'password'          => bcrypt(Str::random(24)),
                'email_verified_at' => now(),
            ]
        );

        // Asigna rol tourist — Google OAuth es exclusivo para turistas
        // Los dueños de restaurante deben registrarse manualmente con email
        if ($user->wasRecentlyCreated) {
            $user->assignRole('tourist');
        }

        // Vincula la cuenta social
        $user->socialAccounts()->create([
            'provider'               => $provider,
            'provider_id'            => $socialUser->getId(),
            'provider_token'         => $socialUser->token,
            'provider_refresh_token' => $socialUser->refreshToken,
            'avatar'                 => $socialUser->getAvatar(),
        ]);

        Auth::login($user, remember: true);

        return $this->redirectAfterSocialLogin($user);
    }

    /** Google es solo para turistas: nunca al panel admin. */
    private function redirectAfterSocialLogin(User $user): \Illuminate\Http\RedirectResponse
    {
        if ($user->hasRole('tourist')) {
            $target = $user->touristProfile?->isCompleted()
                ? route('explore.index')
                : route('profile.setup');

            return redirect()->intended($target);
        }

        return redirect()->intended(route('dashboard'));
    }
}
