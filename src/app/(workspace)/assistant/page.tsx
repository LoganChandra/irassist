import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { AssistantChat } from './assistant-chat';

export const metadata: Metadata = { title: 'AI Assistant' };

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="Plain-English answers on Malaysian employment & industrial relations, grounded in Industrial Court awards."
      />
      <AssistantChat />
    </div>
  );
}
