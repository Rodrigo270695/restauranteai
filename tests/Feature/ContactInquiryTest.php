<?php

use App\Mail\ContactInquiryReceived;
use App\Models\ContactInquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('contact page is accessible', function () {
    $this->get(route('contact.show'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('public/contact'));
});

test('visitor can submit a restaurant integration inquiry', function () {
    Mail::fake();

    $payload = [
        'type' => 'integrate_restaurant',
        'name' => 'María López',
        'email' => 'maria@example.com',
        'phone' => '999888777',
        'restaurant_name' => 'Cevichería El Norte',
        'district' => 'Chiclayo',
        'message' => 'Quisiera registrar mi restaurante en DiscoverLambo para turistas gastronómicos.',
    ];

    $this->post(route('contact.store'), $payload)
        ->assertRedirect(route('contact.show'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('contact_inquiries', [
        'email' => 'maria@example.com',
        'restaurant_name' => 'Cevichería El Norte',
        'type' => 'integrate_restaurant',
    ]);

    Mail::assertSent(ContactInquiryReceived::class, function (ContactInquiryReceived $mail) {
        return $mail->inquiry->email === 'maria@example.com';
    });
});

test('restaurant name is required for integration inquiries', function () {
    $this->post(route('contact.store'), [
        'type' => 'integrate_restaurant',
        'name' => 'Test',
        'email' => 'test@example.com',
        'message' => 'Mensaje suficientemente largo para validar.',
    ])->assertSessionHasErrors('restaurant_name');
});
