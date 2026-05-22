<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactInquiryRequest;
use App\Mail\ContactInquiryReceived;
use App\Models\ContactInquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('public/contact', [
            'defaults' => [
                'name' => $user?->name ?? '',
                'email' => $user?->email ?? '',
                'type' => ContactInquiry::TYPE_INTEGRATE,
            ],
            'supportEmail' => config('discoverlambo.contact_email'),
            'canRegister' => ! $request->user(),
        ]);
    }

    public function store(StoreContactInquiryRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $inquiry = ContactInquiry::create([
            ...$data,
            'user_id' => $request->user()?->id,
            'locale' => $request->header('Accept-Language', 'es') ? substr((string) $request->header('Accept-Language'), 0, 5) : 'es',
            'status' => 'new',
        ]);

        try {
            Mail::to(config('discoverlambo.contact_email'))
                ->send(new ContactInquiryReceived($inquiry));
        } catch (\Throwable $e) {
            Log::warning('Contact inquiry mail failed', [
                'inquiry_id' => $inquiry->id,
                'error' => $e->getMessage(),
            ]);
        }

        return redirect()
            ->route('contact.show')
            ->with('success', 'Tu mensaje fue enviado correctamente.');
    }
}
