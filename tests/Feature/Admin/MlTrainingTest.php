<?php

use App\Models\MlTrainingRun;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

function mlSuperAdmin(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('super_admin');

    return $user;
}

test('super admin can trigger sync ml training and record is stored', function () {
    Http::fake([
        'http://127.0.0.1:8001/api/v1/train' => Http::response([
            'status' => 'trained',
            'metadata' => ['users' => 3, 'restaurants' => 5],
        ]),
    ]);

    $admin = mlSuperAdmin();

    $this->actingAs($admin)
        ->post(route('app.admin.ml-training.store'))
        ->assertRedirect(route('app.admin.ml-training.index'))
        ->assertSessionHas('success');

    $run = MlTrainingRun::query()->first();
    expect($run)->not->toBeNull()
        ->and($run->status)->toBe('success')
        ->and($run->triggered_by_user_id)->toBe($admin->id)
        ->and($run->result)->toBeArray();
});

test('super admin can view ml training history page', function () {
    MlTrainingRun::query()->create([
        'status' => 'success',
        'message' => 'OK',
        'started_at' => now()->subMinute(),
        'finished_at' => now(),
        'duration_seconds' => 60,
        'result' => ['status' => 'trained'],
        'triggered_by_user_id' => null,
        'triggered_by_name' => 'Sistema',
    ]);

    $this->actingAs(mlSuperAdmin())
        ->get(route('app.admin.ml-training.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('runs.data', 1)
            ->where('canTrainMl', true)
            ->where('stats.totalRuns', 1));
});

test('restaurant owner without approval cannot reach ml training route', function () {
    $owner = User::factory()->create(['email_verified_at' => now()]);
    $owner->assignRole('restaurant_owner');

    $this->actingAs($owner)
        ->post(route('app.admin.ml-training.store'))
        ->assertRedirect(route('owner.pending'));
});
