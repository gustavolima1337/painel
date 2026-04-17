"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "./searchable-select";
import type { Filters } from "./dashboard";
import { Download, X } from "lucide-react";

interface FiltersGroupProps {
  eans: string[];
  marketplaces: string[];
  sellers: string[];
  descriptions: string[];
  brands: string[];
  statuses: string[];
  filters: Filters;
  onFilterChange: (filterName: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
  loading: boolean;
}

const FILTER_CONFIG: {
  key: keyof Filters;
  label: string;
  placeholder: string;
  getOptions: (props: FiltersGroupProps) => { value: string; label: string }[];
}[] = [
  { key: 'ean',         label: 'EAN',         placeholder: 'EAN do produto...',   getOptions: p => p.eans.map(v => ({ value: v, label: v })) },
  { key: 'description', label: 'Descrição',   placeholder: 'Nome do produto...',  getOptions: p => p.descriptions.map(v => ({ value: v, label: v })) },
  { key: 'brand',       label: 'Marca',       placeholder: 'Marca...',            getOptions: p => p.brands.map(v => ({ value: v, label: v })) },
  { key: 'marketplace', label: 'Marketplace', placeholder: 'Marketplace...',      getOptions: p => p.marketplaces.map(v => ({ value: v, label: v })) },
  { key: 'seller',      label: 'Vendedor',    placeholder: 'Nome do vendedor...', getOptions: p => p.sellers.map(v => ({ value: v, label: v })) },
  { key: 'status',      label: 'Status',      placeholder: 'Status...',           getOptions: p => p.statuses.map(v => ({ value: v, label: v })) },
];

export function FiltersGroup(props: FiltersGroupProps) {
  const { filters, onFilterChange, onClearFilters, onExport, loading } = props;

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="col-span-full flex justify-end gap-2 pt-1">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {FILTER_CONFIG.map(({ key, label, placeholder, getOptions }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </label>
            <SearchableSelect
              placeholder={placeholder}
              options={getOptions(props)}
              selectedValues={filters[key]}
              onChange={value => onFilterChange(key, value)}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar XLSX
        </Button>
      </div>
    </div>
  );
}
