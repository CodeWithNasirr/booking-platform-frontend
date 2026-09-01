'use client';

import { useApp } from '@/contexts/AppContext';
import { FileText, Download, FileImage } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Section } from './ui';

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const IMG = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

/** Files/deliverables list (read-only downloads). Attachments also appear
 *  inline in the conversation; this surfaces the order's file records. */
export default function OrderFilesCard({ order }) {
  const { t } = useApp();
  const files = Array.isArray(order.files) ? order.files : [];
  if (files.length === 0) return null;

  return (
    <Section icon={FileText} title={`${t('orderDetail.files')} (${files.length})`}>
      <div className="space-y-2">
        {files.map((file) => {
          const name = file.original_filename || file.file_name || 'file';
          const url = resolveMediaUrl(file.file_url || file.file);
          const isImg = IMG.test(name);
          return (
            <a
              key={file.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 overflow-hidden">
                {isImg && url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileImage className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {[file.category, fmtSize(file.file_size)].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground shrink-0" />
            </a>
          );
        })}
      </div>
    </Section>
  );
}
