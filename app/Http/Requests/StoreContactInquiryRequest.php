<?php

namespace App\Http\Requests;

use App\Models\ContactInquiry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $needsRestaurant = in_array($this->input('type'), [
            ContactInquiry::TYPE_INTEGRATE,
            ContactInquiry::TYPE_APPROVAL,
        ], true);

        return [
            'type' => ['required', Rule::in([
                ContactInquiry::TYPE_INTEGRATE,
                ContactInquiry::TYPE_APPROVAL,
                ContactInquiry::TYPE_GENERAL,
            ])],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'restaurant_name' => [$needsRestaurant ? 'required' : 'nullable', 'string', 'max:200'],
            'district' => ['nullable', 'string', 'max:120'],
            'message' => ['required', 'string', 'min:20', 'max:3000'],
        ];
    }
}
