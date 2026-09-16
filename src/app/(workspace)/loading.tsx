import { PageLoader } from '@/components/ui/page-loader';

/**
 * Workspace-wide loading fallback. Route-specific loading.tsx files
 * (awards, templates, assistant) override this with content-shaped
 * skeletons; anything else gets the branded loader.
 */
export default function Loading() {
  return <PageLoader />;
}
