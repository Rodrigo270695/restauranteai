<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\RegisterResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Tras registrarse: dueños → revisión de aprobación; turistas → setup de perfil
        $this->app->instance(RegisterResponse::class, new class implements RegisterResponse
        {
            public function toResponse($request): mixed
            {
                $user = $request->user();
                if ($user && $user->hasRole('tourist')) {
                    return redirect()->route('profile.setup');
                }

                if ($user && $user->hasRole('restaurant_owner')) {
                    return redirect()->route('owner.pending');
                }

                return redirect()->route('dashboard');
            }
        });

        // Tras verificar email → destino según rol
        $this->app->instance(VerifyEmailResponse::class, new class implements VerifyEmailResponse
        {
            public function toResponse($request): mixed
            {
                $user = $request->user();

                if ($user->hasRole('tourist')) {
                    $profileDone = $user->touristProfile?->isCompleted();

                    return redirect()->route($profileDone ? 'explore.index' : 'profile.setup');
                }

                if ($user->hasRole('restaurant_owner')) {
                    $profile = $user->restaurantProfile;
                    if ($profile?->isRejected()) {
                        Auth::logout();
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();

                        return redirect()->route('login')->withErrors([
                            'email' => 'Tu solicitud de negocio fue rechazada. No puedes acceder con esta cuenta.',
                        ]);
                    }
                    if (! $profile || ! $profile->isApproved()) {
                        return redirect()->route('owner.pending');
                    }
                    if ($profile->needsPostApprovalOnboarding()) {
                        return redirect()->route('profile.edit');
                    }

                    return redirect()->route('dashboard');
                }

                return redirect()->route('dashboard');
            }
        });

        // Tras iniciar sesión → destino según rol
        $this->app->instance(LoginResponse::class, new class implements LoginResponse
        {
            public function toResponse($request): mixed
            {
                $user = $request->user();

                if ($user->hasRole('tourist')) {
                    $touristDone = $user->touristProfile?->isCompleted();

                    return redirect()->route($touristDone ? 'explore.index' : 'profile.setup');
                }

                if ($user->hasRole('restaurant_owner')) {
                    $profile = $user->restaurantProfile;
                    if ($profile?->isRejected()) {
                        Auth::logout();
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();

                        return redirect()->route('login')->withErrors([
                            'email' => 'Tu solicitud de negocio fue rechazada. No puedes acceder con esta cuenta.',
                        ]);
                    }
                    if (! $profile || ! $profile->isApproved()) {
                        return redirect()->route('owner.pending');
                    }
                    if ($profile->needsPostApprovalOnboarding()) {
                        return redirect()->route('profile.edit');
                    }

                    return redirect()->route('dashboard');
                }

                return redirect()->route('dashboard');
            }
        });
    }

    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));
        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));
        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
