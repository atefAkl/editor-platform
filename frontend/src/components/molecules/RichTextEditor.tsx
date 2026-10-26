import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'اكتب المحتوى بتنسيق غني هنا...',
  minHeight = '180px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      isUpdatingRef.current = false;
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const addLink = () => {
    const url = prompt('أدخل رابط الويب (URL):', 'https://');
    if (url) {
      exec('createLink', url);
    }
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
      {/* Editor Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1 text-xs select-none">
        <button
          type="button"
          onClick={() => exec('bold')}
          title="عريض (Bold)"
          className="p-1.5 px-2.5 rounded-lg hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          title="مائل (Italic)"
          className="p-1.5 px-2.5 rounded-lg hover:bg-gray-200 text-gray-700 italic font-serif transition-colors cursor-pointer"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          title="تسطير (Underline)"
          className="p-1.5 px-2.5 rounded-lg hover:bg-gray-200 text-gray-700 underline transition-colors cursor-pointer"
        >
          U
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1"></span>

        <button
          type="button"
          onClick={() => exec('formatBlock', '<h2>')}
          title="عنوان رئيسي (H2)"
          className="p-1.5 px-2 rounded-lg hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<h3>')}
          title="عنوان فرعي (H3)"
          className="p-1.5 px-2 rounded-lg hover:bg-gray-200 text-gray-700 font-semibold transition-colors cursor-pointer"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', '<p>')}
          title="فقرة عادية"
          className="p-1.5 px-2 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        >
          فقرة
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1"></span>

        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          title="قائمة نقطية"
          className="p-1.5 px-2 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        >
          • قائمة
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          title="قائمة رقمية"
          className="p-1.5 px-2 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        >
          1. رقمية
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1"></span>

        <button
          type="button"
          onClick={() => exec('formatBlock', '<blockquote>')}
          title="اقتباس أدبي"
          className="p-1.5 px-2 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        >
          ❝ اقتباس
        </button>

        <button
          type="button"
          onClick={addLink}
          title="إضافة رابط"
          className="p-1.5 px-2 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        >
          🔗 رابط
        </button>

        <button
          type="button"
          onClick={() => exec('insertHorizontalRule')}
          title="خط فاصل"
          className="p-1.5 px-2 rounded-lg hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        >
          ― فاصل
        </button>
      </div>

      {/* Editable Body */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className="p-4 outline-none text-gray-900 text-sm sm:text-base leading-relaxed prose max-w-none focus:outline-hidden"
        dir="rtl"
      />
    </div>
  );
};
