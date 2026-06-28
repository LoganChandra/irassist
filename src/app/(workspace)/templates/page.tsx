import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { getTemplates, templateCategories } from '@/lib/data';
import { TemplatesView } from './templates-view';

export const metadata: Metadata = { title: 'Templates' };

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Ready-to-use IR letters, notices and forms — drafted for Malaysian employment practice."
      >
        <Button>
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </PageHeader>

      <TemplatesView templates={getTemplates()} categories={templateCategories()} />
    </div>
  );
}
