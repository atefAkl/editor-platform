import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md';
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'gray', size = 'sm' }) => {
  const sizeStyle = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyle}`}
    >
      {label}
    </span>
  );
};

export const WorkflowBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'draft':
      return <Badge label="مسودة" variant="gray" />;
    case 'in_review':
      return <Badge label="قيد المراجعة" variant="warning" />;
    case 'changes_requested':
      return <Badge label="بحاجة لتعديلات" variant="danger" />;
    case 'approved':
      return <Badge label="معتمد" variant="success" />;
    default:
      return <Badge label={status} variant="gray" />;
  }
};

export const PublicationBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'unpublished':
      return <Badge label="غير منشور" variant="gray" />;
    case 'published':
      return <Badge label="منشور للعامة" variant="success" />;
    case 'temporarily_unpublished':
      return <Badge label="موقوف مؤقتاً" variant="warning" />;
    case 'publication_cancelled':
      return <Badge label="ملغى النشر نهائياً" variant="danger" />;
    default:
      return <Badge label={status} variant="gray" />;
  }
};
