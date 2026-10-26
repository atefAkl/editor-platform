<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('books.create');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'introduction' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'in:novels,short_stories,poetry,articles'],
            'author_id' => ['nullable', 'exists:authors,id'],
            'declared_publication_date' => ['nullable', 'date'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'], // 5MB
            'book_file' => ['nullable', 'file', 'mimes:pdf,epub', 'max:51200'], // 50MB
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان الكتاب مطلوب.',
            'title.max' => 'يجب ألا يتجاوز عنوان الكتاب 255 حرفاً.',
            'author_id.exists' => 'المؤلف المختار غير موجود.',
            'cover_image.image' => 'يجب أن يكون الغلاف صورة صالحة.',
            'cover_image.mimes' => 'صيغ الغلاف المدعومة هي: JPEG, PNG, WEBP.',
            'cover_image.max' => 'الحد الأقصى لحجم الغلاف هو 5 ميجابايت.',
            'book_file.mimes' => 'صيغ ملف الكتاب المدعومة هي: PDF, EPUB.',
            'book_file.max' => 'الحد الأقصى لحجم ملف الكتاب هو 50 ميجابايت.',
        ];
    }
}
