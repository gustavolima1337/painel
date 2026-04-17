"use client";

import { useMemo } from 'react';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight, Minus, Scale, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparativeAnalysisProps {
  filteredProducts: Product[];
  loading: boolean;
  selectedMarketplace: string;
}

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  highlight?: 'positive' | 'negative' | 'neutral';
}

function KpiCard({ title, value, subtitle, icon, iconBg, highlight }: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground leading-tight">{title}</p>
        <div className={cn('kpi-card-icon', iconBg)}>{icon}</div>
      </div>
      <div>
        <p
          className={cn(
            'text-3xl font-bold tracking-tight tabular-nums',
            highlight === 'positive' && 'text-emerald-600 dark:text-emerald-400',
            highlight === 'negative' && 'text-destructive',
            (!highlight || highlight === 'neutral') && 'text-foreground',
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function ComparativeAnalysis({ filteredProducts, loading, selectedMarketplace }: ComparativeAnalysisProps) {
  const analysis = useMemo(() => {
    if (!selectedMarketplace) {
      return { totalMarketplaceProducts: 0, totalSharedProducts: 0, cheaperCount: 0, moreExpensiveCount: 0 };
    }

    const mpProducts    = filteredProducts.filter(p => p.marketplace === selectedMarketplace);
    const otherProducts = filteredProducts.filter(p => p.marketplace !== selectedMarketplace);

    const mpEans    = new Set(mpProducts.map(p => p.ean));
    const otherEans = new Set(otherProducts.map(p => p.ean));
    const sharedEans = [...mpEans].filter(ean => otherEans.has(ean));

    let cheaperCount = 0;
    let moreExpensiveCount = 0;

    sharedEans.forEach(ean => {
      const mp          = mpProducts.find(p => p.ean === ean)!;
      const competitors = otherProducts.filter(p => p.ean === ean);
      if (competitors.length > 0) {
        const minElsewhere = Math.min(...competitors.map(p => p.price));
        if (mp.price < minElsewhere)      cheaperCount++;
        else if (mp.price > minElsewhere) moreExpensiveCount++;
      }
    });

    return {
      totalMarketplaceProducts: mpProducts.length,
      totalSharedProducts: sharedEans.length,
      cheaperCount,
      moreExpensiveCount,
    };
  }, [filteredProducts, selectedMarketplace]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <KpiCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!selectedMarketplace || analysis.totalMarketplaceProducts === 0) return null;

  const tieCount =
    analysis.totalSharedProducts - analysis.cheaperCount - analysis.moreExpensiveCount;

  const cards: KpiCardProps[] = [
    {
      title: `Ofertas em ${selectedMarketplace}`,
      value: analysis.totalMarketplaceProducts,
      subtitle: 'Total de ofertas ativas (com filtros)',
      icon: <ShoppingBag className="h-5 w-5 text-primary" />,
      iconBg: 'bg-primary/10',
    },
    {
      title: 'Compartilhados com concorrentes',
      value: analysis.totalSharedProducts,
      subtitle: 'Produtos presentes em outros marketplaces',
      icon: <Scale className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
      iconBg: 'bg-violet-500/10',
    },
    {
      title: 'Mais baratos',
      value: analysis.cheaperCount,
      subtitle: `Menor preço vs. concorrência${tieCount > 0 ? ` · ${tieCount} empates` : ''}`,
      icon: <ArrowDownRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-500/10',
      highlight: 'positive',
    },
    {
      title: 'Mais caros',
      value: analysis.moreExpensiveCount,
      subtitle: 'Maior preço vs. concorrência',
      icon: <ArrowUpRight className="h-5 w-5 text-destructive" />,
      iconBg: 'bg-destructive/10',
      highlight: 'negative',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => <KpiCard key={card.title} {...card} />)}
    </div>
  );
}
