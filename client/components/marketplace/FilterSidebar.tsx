import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export interface FilterState {
  categories: string[];
  states: string[];
  minPrice: number;
  maxPrice: number;
  location: string;
  evaluationType: string;
  featuredOnly: boolean;
}

const WILAYAS = [
  "Alger",
  "Oran",
  "Constantine",
  "Annaba",
  "Tlemcen",
  "Batna",
  "Sétif",
  "Tizi Ouzou",
  "Béjaïa",
  "Blida",
  "Boumerdès",
  "Chlef",
  "Tipaza",
  "Ain Defla",
  "Médéa",
  "Aïn Témouchent",
  "Mascara",
  "Tiaret",
  "Relizane",
  "Saïda",
  "Khemis Miliana",
  "Laghouat",
  "Ouargla",
  "Illizi",
  "Hassi Messaoud",
  "Ghardaia",
  "El Oued",
  "Tindouf",
  "Adrar",
  "Béni Abbès",
  "In Salah",
  "In Guezzam",
  "Tamanrasset",
  "Djanet",
];

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export const FilterSidebar = ({
  filters,
  onFilterChange,
  onReset,
  isMobile = false,
  onClose,
}: FilterSidebarProps) => {
  const [priceRange, setPriceRange] = useState([filters.minPrice, filters.maxPrice]);

  const handleCategoryChange = (category: string, checked: boolean) => {
    const updatedCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter((c) => c !== category);
    onFilterChange({ ...filters, categories: updatedCategories });
  };

  const handleStateChange = (state: string, checked: boolean) => {
    const updatedStates = checked
      ? [...filters.states, state]
      : filters.states.filter((s) => s !== state);
    onFilterChange({ ...filters, states: updatedStates });
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value);
    onFilterChange({ ...filters, minPrice: value[0], maxPrice: value[1] });
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Category
        </h4>
        <div className="space-y-2">
          {["startup", "shares", "domain", "patent", "app", "saas", "design"].map(
            (category) => (
              <div key={category} className="flex items-center gap-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category, checked as boolean)
                  }
                />
                <label
                  htmlFor={`category-${category}`}
                  className="text-sm cursor-pointer capitalize"
                >
                  {category}
                </label>
              </div>
            )
          )}
        </div>
      </div>

      {/* States */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          State
        </h4>
        <div className="space-y-2">
          {[
            { value: "finished", label: "Finished" },
            { value: "in_execution", label: "In Execution" },
            { value: "testing", label: "Testing" },
            { value: "in_development", label: "In Development" },
            { value: "idea", label: "Idea" },
          ].map(({ value, label }) => (
            <div key={value} className="flex items-center gap-2">
              <Checkbox
                id={`state-${value}`}
                checked={filters.states.includes(value)}
                onCheckedChange={(checked) =>
                  handleStateChange(value, checked as boolean)
                }
              />
              <label
                htmlFor={`state-${value}`}
                className="text-sm cursor-pointer"
              >
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Price Range (DA)
        </h4>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={handlePriceChange}
            min={0}
            max={1000000}
            step={10000}
            className="w-full"
          />
          <div className="flex gap-2 text-sm">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Min</label>
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) =>
                  handlePriceChange([parseInt(e.target.value), priceRange[1]])
                }
                className="w-full px-2 py-1 border border-input rounded text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Max</label>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) =>
                  handlePriceChange([priceRange[0], parseInt(e.target.value)])
                }
                className="w-full px-2 py-1 border border-input rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Location (Wilaya)
        </h4>
        <Select value={filters.location || "all"} onValueChange={(value) =>
          onFilterChange({ ...filters, location: value === "all" ? "" : value })
        }>
          <SelectTrigger>
            <SelectValue placeholder="Select a wilaya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wilayas</SelectItem>
            {WILAYAS.map((wilaya) => (
              <SelectItem key={wilaya} value={wilaya}>
                {wilaya}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Evaluation Type */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Evaluation Type
        </h4>
        <Select value={filters.evaluationType || "all"} onValueChange={(value) =>
          onFilterChange({ ...filters, evaluationType: value === "all" ? "" : value })
        }>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="self">Auto-Estimé</SelectItem>
            <SelectItem value="local_expert">Expert Local</SelectItem>
            <SelectItem value="certified">Certifié</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Featured Only */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="featured-only"
            checked={filters.featuredOnly}
            onCheckedChange={(checked) =>
              onFilterChange({ ...filters, featuredOnly: checked as boolean })
            }
          />
          <label
            htmlFor="featured-only"
            className="text-sm cursor-pointer font-medium"
          >
            Featured Only
          </label>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={onReset}
      >
        Clear All Filters
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:hidden">
        <div className="w-full bg-background rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return <div className="w-full">{content}</div>;
};
