import React from 'react';
import { CATEGORIES } from '../data/products';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  productCounts: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  productCounts
}) => {
  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2">
      {/* Clean segmented category pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = productCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-[#1C1917] text-[#FAF7F2] border-[#1C1917]'
                  : 'bg-[#FAF7F2] text-[#57534E] border-[#E5DACD] hover:text-[#1C1917]'
              }`}
            >
              <span>{cat.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                    isSelected ? 'bg-[#38332E] text-[#E6C694]' : 'bg-[#EFE8DD] text-[#78716C]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
