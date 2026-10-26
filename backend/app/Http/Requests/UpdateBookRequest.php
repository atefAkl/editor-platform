<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('books.update');
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'introduction' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'in:novels,short_stories,poetry,articles'],
            'author_id' => ['sometimes', 'required', 'exists:authors,id'],
            'declared_publication_date' => ['nullable', 'date'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'book_file' => ['nullable', 'file', 'mimes:pdf,epub', 'max:51200'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'عنوان الكتاب مطلوب.',
            'author_id.exists' => 'المؤلف المختار غير موجود.',
            'cover_image.image' => 'يجب أن يكون الغلاف صورة صالحة.',
            'book_file.mimes' => 'صيغ ملف الكتاب المدعومة هي: PDF, EPUB.',
        ];
    }
}
