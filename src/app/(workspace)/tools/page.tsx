import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { Calculators } from './calculators';

export const metadata: Metadata = { title: 'Tools & Calculators' };

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools & Calculators"
        description="Quick indicative estimates for notice, benefits, leave and backwages — grounded in Malaysian Employment Act conventions."
      />
      <Calculators />
    </div>
  );
}
