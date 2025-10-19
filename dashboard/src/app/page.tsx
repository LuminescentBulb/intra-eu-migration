'use client';
import dynamic from 'next/dynamic';

// Disable SSR for the entire dashboard to avoid hydration issues with URL params
const DashboardContent = dynamic(() => import('./dashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="text-gray-400">Loading dashboard...</div>
    </div>
  ),
});

export default function Home() {
  return <DashboardContent />;
}