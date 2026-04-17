import { Dashboard } from '@/components/dashboard/dashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PriceTrack — Monitoramento de Preços',
  description: 'Monitore preços, analise buybox e tome decisões estratégicas em tempo real.',
};

export default function Home() {
  return <Dashboard />;
}
