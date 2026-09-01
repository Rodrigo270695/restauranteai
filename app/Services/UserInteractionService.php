<?php

namespace App\Services;

use App\Models\Recommendation;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\UserInteraction;
use Illuminate\Support\Facades\Cache;

class UserInteractionService
{
    public function __construct(
        private MlRecommendationClient $mlClient,
        private RecommendationService $recommendations,
        private UserPreferenceService $preferences,
    ) {}

    public function record(
        User $user,
        ?Restaurant $restaurant,
        string $type,
        ?string $searchQuery = null,
    ): UserInteraction {
        $interaction = UserInteraction::create([
            'user_id' => $user->id,
            'restaurant_id' => $restaurant?->id,
            'interaction_type' => $type,
            'search_query' => $searchQuery,
        ]);

        if ($restaurant) {
            $this->notifyMl($user, $restaurant, $type);
            $this->recommendations->bustCacheForUser($user);
        }

        return $interaction;
    }

    public function recordViewOnce(User $user, Restaurant $restaurant): void
    {
        $key = sprintf('ui:view:%d:%d:%s', $user->id, $restaurant->id, now()->toDateString());

        if (Cache::has($key)) {
            return;
        }

        Cache::put($key, true, now()->endOfDay());
        $this->record($user, $restaurant, 'view');
    }

    public function isFavorited(User $user, Restaurant $restaurant): bool
    {
        $latest = UserInteraction::query()
            ->where('user_id', $user->id)
            ->where('restaurant_id', $restaurant->id)
            ->whereIn('interaction_type', ['save', 'unsave'])
            ->orderByDesc('id')
            ->value('interaction_type');

        return $latest === 'save';
    }

    /** @return list<int> */
    public function favoritedRestaurantIds(User $user): array
    {
        $latestByRestaurant = [];

        UserInteraction::query()
            ->where('user_id', $user->id)
            ->whereNotNull('restaurant_id')
            ->whereIn('interaction_type', ['save', 'unsave'])
            ->orderByDesc('id')
            ->get(['restaurant_id', 'interaction_type'])
            ->each(function (UserInteraction $row) use (&$latestByRestaurant) {
                $id = (int) $row->restaurant_id;
                if (! array_key_exists($id, $latestByRestaurant)) {
                    $latestByRestaurant[$id] = $row->interaction_type;
                }
            });

        return array_keys(array_filter(
            $latestByRestaurant,
            fn (string $type) => $type === 'save',
        ));
    }

    /**
     * @return array<int, string> restaurant_id => ISO saved_at
     */
    public function favoritedRestaurantSavedAt(User $user): array
    {
        $seen = [];
        $saved = [];

        UserInteraction::query()
            ->where('user_id', $user->id)
            ->whereNotNull('restaurant_id')
            ->whereIn('interaction_type', ['save', 'unsave'])
            ->orderByDesc('id')
            ->get(['restaurant_id', 'interaction_type', 'created_at'])
            ->each(function (UserInteraction $row) use (&$seen, &$saved) {
                $id = (int) $row->restaurant_id;
                if (isset($seen[$id])) {
                    return;
                }
                $seen[$id] = true;
                if ($row->interaction_type === 'save') {
                    $saved[$id] = $row->created_at?->toIso8601String() ?? now()->toIso8601String();
                }
            });

        return $saved;
    }

    public function markRecommendationEngagement(User $user, Restaurant $restaurant, ?int $requestId = null): void
    {
        $query = Recommendation::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('was_viewed', false)
            ->whereHas('request', fn ($q) => $q->where('user_id', $user->id));

        if ($requestId) {
            $query->where('request_id', $requestId);
        }

        $query->update(['was_viewed' => true]);
    }

    public function markRecommendationAccepted(User $user, Restaurant $restaurant): void
    {
        Recommendation::query()
            ->where('restaurant_id', $restaurant->id)
            ->whereHas('request', fn ($q) => $q->where('user_id', $user->id))
            ->where('was_accepted', false)
            ->update(['was_accepted' => true]);

        $this->record($user, $restaurant, 'recommendation_accepted');
    }

    private function notifyMl(User $user, Restaurant $restaurant, string $type): void
    {
        $pref = $this->preferences->activeFor($user);
        $context = FallbackRecommendationEngine::contextFromUser($user, $pref);

        $this->mlClient->feedback([
            'user_id' => $user->id,
            'restaurant_id' => $restaurant->id,
            'interaction_type' => $type,
            'context' => [
                'latitude' => $context['latitude'] ?? null,
                'longitude' => $context['longitude'] ?? null,
                'budget' => $context['budget'] ?? null,
                'party_type_ids' => $context['party_type_ids'] ?? [],
                'time_slot' => $context['time_slot'] ?? null,
                'max_distance_km' => (float) ($context['max_distance_km'] ?? 15),
                'cuisine_type_id' => $context['cuisine_type_id'] ?? null,
                'ambiance_id' => $context['ambiance_id'] ?? null,
                'dietary_option_ids' => $context['dietary_option_ids'] ?? [],
                'restaurant_environment_ids' => $context['restaurant_environment_ids'] ?? [],
                'recommended_moment_ids' => $context['recommended_moment_ids'] ?? [],
                'service_ids' => $context['service_ids'] ?? [],
                'language_ids' => $context['language_ids'] ?? [],
                'min_rating' => $context['min_rating'] ?? null,
            ],
        ]);
    }
}
