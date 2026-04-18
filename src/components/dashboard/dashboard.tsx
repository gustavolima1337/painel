"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Product } from '@/types';
import { AlertCircle, BarChart3, RefreshCw, ShoppingBag, Sparkles, Store, TrendingUp, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FiltersGroup } from './filters-group';
import { ProductAccordion } from './product-accordion';
import { ComparativeAnalysis } from './comparative-analysis';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceComparisonTable } from './price-comparison-table';
import { SellerComparisonTable } from './seller-comparison-table';
import { Toaster } from '@/components/ui/toaster';
import { isValidHttpUrl, isValidImageUrl } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { BuyboxCompetitionAnalysis } from './buybox-competition-analysis';
import { AutoPriceChange } from './auto-price-change';
import { Badge } from '../ui/badge';

function adaptApiData(apiProduct: any): Product {
  const imageUrl = apiProduct.imagem?.startsWith('//')
    ? `https:${apiProduct.imagem}`
    : apiProduct.imagem;

  return {
    id: apiProduct.sku,
    ean: apiProduct.ean,
    key_sku: apiProduct.key_sku,
    name: apiProduct.descricao,
    brand: apiProduct.marca,
    marketplace: apiProduct.marketplace,
    seller: apiProduct.loja,
    key_loja: apiProduct.key_loja,
    price: parseFloat(apiProduct.preco_final),
    preco_pricing: apiProduct.preco_pricing ? parseFloat(apiProduct.preco_pricing) : null,
    preco_buybox: apiProduct.preco_buybox ? parseFloat(apiProduct.preco_buybox) : null,
    url: isValidHttpUrl(apiProduct.url) ? apiProduct.url : null,
    image: imageUrl,
    updated_at: apiProduct.data_hora,
    status: apiProduct.status,
    change_price: apiProduct.change_price,
  };
}

export type Filters = {
  ean: string[];
  marketplace: string[];
  seller: string[];
  description: string[];
  brand: string[];
  status: string[];
};

const NAV_TABS = [
  { value: 'overview',    label: 'Visão Geral',           icon: ShoppingBag },
  { value: 'granular',    label: 'Por Marketplace',        icon: Store },
  { value: 'buybox',      label: 'Buybox',                 icon: TrendingUp },
  { value: 'seller',      label: 'Por Vendedor',           icon: BarChart3 },
  { value: 'auto_pricing',label: 'Precificação Auto',      icon: Zap,   badge: 'Beta' },
] as const;

function DashboardContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [comparisonMarketplace, setComparisonMarketplace] = useState<string>("");
  const [showOnlyWithCompetitors, setShowOnlyWithCompetitors] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    ean: [], marketplace: [], seller: [], description: [], brand: [], status: [],
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/price-data?limit=2000');
      if (!res.ok) throw new Error(`Status ${res.status} ${res.statusText}`);

      const data = await res.json();
      const results = data.results || data;
      if (!Array.isArray(results)) throw new Error("Formato de dados inesperado da API.");

      const adapted = results.map(adaptApiData).filter(p => p.status === 'ativo');

      const merged = adapted.map(product => {
        const sameEan = adapted.filter(p => p.ean === product.ean && isValidImageUrl(p.image));
        const imgSource =
          sameEan.find(p => p.marketplace === 'Beleza na Web') ||
          sameEan.find(p => p.marketplace === 'Época Cosméticos') ||
          sameEan.find(p => p.marketplace === 'Magazine Luiza') ||
          sameEan.find(p => p.marketplace === 'Amazon') ||
          sameEan[0];

        if (!isValidImageUrl(product.image) && imgSource?.image) {
          return { ...product, image: imgSource.image };
        }
        return product;
      });

      setProducts(merged);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const uniqueEans         = useMemo(() => [...new Set(products.map(p => p.ean).filter(Boolean))].sort(), [products]);
  const uniqueMarketplaces = useMemo(() => [...new Set(products.map(p => p.marketplace).filter(Boolean))].sort(), [products]);
  const uniqueSellers      = useMemo(() => [...new Set(products.map(p => p.seller).filter(Boolean))].sort(), [products]);
  const uniqueDescriptions = useMemo(() => [...new Set(products.map(p => p.name).filter(Boolean))].sort(), [products]);
  const uniqueBrands       = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))].sort(), [products]);
  const uniqueStatuses     = useMemo(() => [...new Set(products.map(p => p.status).filter(Boolean))].sort(), [products]);

  useEffect(() => {
    if (uniqueMarketplaces.length > 0 && !comparisonMarketplace) {
      setComparisonMarketplace(
        uniqueMarketplaces.find(m => m.toLowerCase().includes('época')) || uniqueMarketplaces[0]
      );
    }
  }, [uniqueMarketplaces, comparisonMarketplace]);

  const filteredProducts = useMemo(() => {
    let base = products;
    if (showOnlyWithCompetitors) {
      const byEan = products.reduce<Record<string, Set<string>>>((acc, p) => {
        if (p.ean) { acc[p.ean] = acc[p.ean] || new Set(); acc[p.ean].add(p.marketplace); }
        return acc;
      }, {});
      const withCompetitors = new Set(Object.keys(byEan).filter(e => byEan[e].size > 1));
      base = products.filter(p => p.ean && withCompetitors.has(p.ean));
    }
    return base.filter(p => {
      if (filters.ean.length         && !filters.ean.includes(p.ean))             return false;
      if (filters.marketplace.length && !filters.marketplace.includes(p.marketplace)) return false;
      if (filters.seller.length      && !filters.seller.includes(p.seller))       return false;
      if (filters.description.length && !filters.description.includes(p.name))    return false;
      if (filters.brand.length       && !filters.brand.includes(p.brand))         return false;
      if (filters.status.length      && !filters.status.includes(p.status))       return false;
      return true;
    });
  }, [products, filters, showOnlyWithCompetitors]);

  const handleFilterChange = (filterName: keyof Filters, value: string) => {
    setFilters(prev => {
      const current = prev[filterName];
      return {
        ...prev,
        [filterName]: current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
  };

  const clearFilters = () => {
    setFilters({ ean: [], marketplace: [], seller: [], description: [], brand: [], status: [] });
    setShowOnlyWithCompetitors(false);
  };

  const handleExport = () => {
    const rows = filteredProducts.map(p => ({
      EAN: p.ean, Descrição: p.name, Marca: p.brand || '',
      Marketplace: p.marketplace, Vendedor: p.seller,
      Preço: p.price, URL: p.url || '', Status: p.status || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, `pricetrack_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalActiveProducts = products.length;
  const activeFilters = Object.values(filters).flat().length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />

      {/* ── Header ── */}
      <header className="page-header border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-foreground">PriceTrack</span>
              <span className="hidden md:block text-xs text-muted-foreground leading-none mt-0.5">
                Inteligência de preços
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {!loading && totalActiveProducts > 0 && (
              <span className="hidden sm:flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-foreground">{totalActiveProducts.toLocaleString('pt-BR')}</span>
                <span>ofertas ativas</span>
              </span>
            )}
            {lastUpdated && (
              <span className="hidden md:block text-xs">
                Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <Tabs defaultValue="overview" className="flex flex-col flex-1">

        {/* ── Tab Navigation ── */}
        <div className="border-b bg-card/40 backdrop-blur-sm sticky top-[57px] z-30">
          <div className="max-w-screen-2xl mx-auto px-6">
            <TabsList className="h-auto bg-transparent p-0 gap-0 rounded-none">
              {NAV_TABS.map(({ value, label, icon: Icon, badge }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative h-11 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent hover:text-foreground gap-2"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                  {badge && (
                    <Badge variant="secondary" className="ml-1 py-0 px-1.5 text-[10px] font-semibold">
                      {badge}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1">
          <div className="max-w-screen-2xl mx-auto px-6 py-6">

            {/* Overview */}
            <TabsContent value="overview" className="mt-0 space-y-6">

              {/* Marketplace selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Visão Geral</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Compare preços do marketplace selecionado contra a concorrência.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Marketplace base</span>
                  <Select value={comparisonMarketplace} onValueChange={setComparisonMarketplace} disabled={loading}>
                    <SelectTrigger className="w-52">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueMarketplaces.map(mp => (
                        <SelectItem key={mp} value={mp}>{mp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ComparativeAnalysis
                filteredProducts={filteredProducts}
                loading={loading}
                selectedMarketplace={comparisonMarketplace}
              />

              {/* Filters card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">Filtros</h3>
                      {activeFilters > 0 && (
                        <Badge variant="secondary" className="tabular-nums">
                          {activeFilters} ativo{activeFilters > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="competitors-only"
                        checked={showOnlyWithCompetitors}
                        onCheckedChange={setShowOnlyWithCompetitors}
                        disabled={loading}
                      />
                      <Label htmlFor="competitors-only" className="text-sm cursor-pointer select-none">
                        Apenas com concorrentes
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FiltersGroup
                    eans={uniqueEans}
                    marketplaces={uniqueMarketplaces}
                    sellers={uniqueSellers}
                    descriptions={uniqueDescriptions}
                    brands={uniqueBrands}
                    statuses={uniqueStatuses}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                    onExport={handleExport}
                    loading={loading}
                  />
                </CardContent>
              </Card>

              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro de comunicação</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <ProductAccordion products={filteredProducts} loading={loading} />
              )}
            </TabsContent>

            <TabsContent value="granular" className="mt-0">
              <PriceComparisonTable allProducts={filteredProducts} loading={loading} />
            </TabsContent>

            <TabsContent value="buybox" className="mt-0">
              <BuyboxCompetitionAnalysis allProducts={products} loading={loading} />
            </TabsContent>

            <TabsContent value="seller" className="mt-0">
              <SellerComparisonTable allProducts={filteredProducts} loading={loading} />
            </TabsContent>

            <TabsContent value="auto_pricing" className="mt-0">
              <AutoPriceChange allProducts={products} loading={loading} />
            </TabsContent>

          </div>
        </div>
      </Tabs>
    </div>
  );
}

export function Dashboard() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  );
}
