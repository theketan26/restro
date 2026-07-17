import React, { useState, useEffect, ReactNode } from "react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export interface TableColumn<T> {
  header: ReactNode;
  accessorKey?: keyof T;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableFilter<T> {
  key: keyof T;
  label: string;
  options: { label: string; value: string }[];
  matchFn?: (item: T, value: string) => boolean;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  searchableFields?: (keyof T)[];
  searchPlaceholder?: string;
  filters?: TableFilter<T>[];
  itemsPerPage?: number;
  isLoading?: boolean;
  error?: any;
  emptyState?: ReactNode;
  noResultsState?: ReactNode;
  className?: string;

  // Server-side control props
  serverSide?: boolean;
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filterValues?: Record<string, string>;
  onFilterChange?: (values: Record<string, string>) => void;
  onItemsPerPageChange?: (size: number) => void;
  totalUnfiltered?: number;
}

export function Table<T>({
  data = [],
  columns,
  searchableFields = [],
  searchPlaceholder = "Search...",
  filters = [],
  itemsPerPage = 20,
  isLoading = false,
  error = null,
  emptyState,
  noResultsState,
  className = "",

  // Server-side props
  serverSide = false,
  totalItems,
  currentPage,
  onPageChange,
  searchTerm,
  onSearchChange,
  filterValues,
  onFilterChange,
  onItemsPerPageChange,
  totalUnfiltered,
}: TableProps<T>) {
  // Internal state for when serverSide is false
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [internalFilterValues, setInternalFilterValues] = useState<Record<string, string>>({});
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(itemsPerPage);

  // Active state based on mode
  const activeSearchTerm = serverSide && searchTerm !== undefined ? searchTerm : internalSearchTerm;
  const activeFilterValues = serverSide && filterValues !== undefined ? filterValues : internalFilterValues;
  const activeCurrentPage = serverSide && currentPage !== undefined ? currentPage : internalCurrentPage;
  const activePageSize = serverSide && itemsPerPage !== undefined ? itemsPerPage : internalPageSize;

  const [pageSizeInputVal, setPageSizeInputVal] = useState(activePageSize.toString());

  useEffect(() => {
    setInternalPageSize(itemsPerPage);
  }, [itemsPerPage]);

  useEffect(() => {
    setPageSizeInputVal(activePageSize.toString());
  }, [activePageSize]);

  const setActivePageSize = (size: number) => {
    if (serverSide && onItemsPerPageChange) {
      onItemsPerPageChange(size);
    } else {
      setInternalPageSize(size);
    }
  };

  const setActiveSearchTerm = (term: string) => {
    if (serverSide && onSearchChange) {
      onSearchChange(term);
    } else {
      setInternalSearchTerm(term);
    }
  };

  const setActiveFilterValues = (
    values: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => {
    if (serverSide && onFilterChange) {
      if (typeof values === "function") {
        onFilterChange(values(activeFilterValues));
      } else {
        onFilterChange(values);
      }
    } else {
      setInternalFilterValues(values);
    }
  };

  const setActiveCurrentPage = (page: number | ((prev: number) => number)) => {
    if (serverSide && onPageChange) {
      if (typeof page === "function") {
        onPageChange(page(activeCurrentPage));
      } else {
        onPageChange(page);
      }
    } else {
      setInternalCurrentPage(page);
    }
  };

  // Reset pagination when search or filters change
  useEffect(() => {
    setActiveCurrentPage(1);
  }, [activeSearchTerm, activeFilterValues]);

  const handleClearFilters = () => {
    setActiveSearchTerm("");
    setActiveFilterValues({});
  };

  // 1. Filtering logic
  const filteredData = serverSide
    ? data
    : data.filter((item) => {
        // Search term match
        if (activeSearchTerm.trim() !== "" && searchableFields.length > 0) {
          const matchesSearch = searchableFields.some((field) => {
            const value = item[field];
            if (value === undefined || value === null) return false;
            return String(value)
              .toLowerCase()
              .includes(activeSearchTerm.toLowerCase());
          });
          if (!matchesSearch) return false;
        }

        // Dropdown filters match
        for (const filter of filters) {
          const selectedValue = activeFilterValues[String(filter.key)];
          if (selectedValue && selectedValue !== "all") {
            if (filter.matchFn) {
              if (!filter.matchFn(item, selectedValue)) return false;
            } else {
              const itemValue = item[filter.key];
              if (String(itemValue) !== selectedValue) return false;
            }
          }
        }

        return true;
      });

  // 2. Pagination calculation
  const totalItemsCount = serverSide ? (totalItems ?? data.length) : filteredData.length;
  const totalPages = Math.ceil(totalItemsCount / activePageSize) || 1;
  const activePage = Math.min(activeCurrentPage, totalPages);
  
  const startIndex = (activePage - 1) * activePageSize;
  const endIndex = serverSide
    ? startIndex + data.length
    : Math.min(startIndex + activePageSize, totalItemsCount);
  const paginatedData = serverSide ? data : filteredData.slice(startIndex, endIndex);

  // Helper to check if any filters are active
  const hasActiveFilters =
    activeSearchTerm.trim() !== "" ||
    Object.values(activeFilterValues).some((val) => val && val !== "all");

  // Format active filters summary text
  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeSearchTerm.trim() !== "") count++;
    Object.values(activeFilterValues).forEach((val) => {
      if (val && val !== "all") count++;
    });
    return count;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const range = 2; // how many pages to show around active page
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= activePage - range && i <= activePage + range)
      ) {
        pages.push(i);
      } else if (
        (i === 2 && activePage - range > 2) ||
        (i === totalPages - 1 && activePage + range < totalPages - 1)
      ) {
        pages.push("...");
      }
    }
    return pages.filter((item, index) => {
      if (item === "...") {
        return pages[index - 1] !== "...";
      }
      return true;
    });
  };

  // Loading state handled inside table body container to preserve search inputs mount/focus

  // Render error state
  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="font-semibold">Error Loading Data</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
            {error.message || String(error) || "Failed to fetch resources."}
          </p>
        </div>
      </div>
    );
  }

  // Render empty state or no results state if no data is available
  if (data.length === 0 && !isLoading && !error) {
    const unfilteredCount = serverSide ? (totalUnfiltered ?? 0) : data.length;

    if (hasActiveFilters && unfilteredCount > 0) {
      // Do not return early; let the component render the filter bar and the noResultsState below it.
    } else {
      return emptyState ? (
        <>{emptyState}</>
      ) : (
        <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/20">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4a2 2 0 00-2 2v1a2 2 0 01-2 2H8a2 2 0 01-2-2v-1a2 2 0 00-2-2H4" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No data available</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
            There are no items to display at this time.
          </p>
        </div>
      );
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search & Filters Bar */}
      {(searchableFields.length > 0 || filters.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-neutral-950">
          {searchableFields.length > 0 && (
            <div className="w-full sm:max-w-md">
              <Input
                placeholder={searchPlaceholder}
                value={activeSearchTerm}
                onChange={(e) => setActiveSearchTerm(e.target.value)}
                variant="outlined"
                inputSize="md"
                leftIcon={
                  <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
          )}

          {filters.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
              {filters.map((filter) => (
                <div key={String(filter.key)} className="w-full sm:w-auto">
                  <select
                    value={activeFilterValues[String(filter.key)] || "all"}
                    onChange={(e) =>
                      setActiveFilterValues((prev) => ({
                        ...prev,
                        [String(filter.key)]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-neutral-300 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  >
                    <option value="all" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                      All {filter.label}s
                    </option>
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-1.5 px-1 py-0.5 animate-fadeIn">
          <span>
            Found <span className="font-semibold text-neutral-700 dark:text-neutral-300">{totalItemsCount}</span>{" "}
            {totalItemsCount === 1 ? "result" : "results"}
          </span>
          {activeSearchTerm && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span>
                search: <span className="font-semibold text-neutral-700 dark:text-neutral-300">"{activeSearchTerm}"</span>
              </span>
            </>
          )}
          {filters.map((filter) => {
            const filterVal = activeFilterValues[String(filter.key)];
            if (!filterVal || filterVal === "all") return null;
            const optionLabel =
              filter.options.find((o) => o.value === filterVal)?.label || filterVal;
            return (
              <React.Fragment key={String(filter.key)}>
                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span>
                  {filter.label.toLowerCase()}:{" "}
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">
                    {optionLabel}
                  </span>
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Table Data or Loading or No Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">Loading data...</p>
        </div>
      ) : filteredData.length === 0 ? (
        noResultsState ? (
          <>{noResultsState}</>
        ) : (
          <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/20 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No matches found</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
              Try adjusting your search query or filter selections.
            </p>
            <Button
              onClick={handleClearFilters}
              className="mt-5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium transition duration-200 shadow-sm"
            >
              Clear Filters
            </Button>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-neutral-500 dark:text-neutral-400">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  {columns.map((column, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className={`px-6 py-4 ${column.headerClassName || ""}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {paginatedData.map((item, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition duration-150"
                  >
                    {columns.map((column, colIdx) => {
                      const content = column.render
                        ? column.render(item, rowIdx)
                        : column.accessorKey
                        ? String(item[column.accessorKey] ?? "")
                        : "";

                      return (
                        <td
                          key={colIdx}
                          className={`px-6 py-4 ${column.className || ""}`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 bg-neutral-50 dark:bg-neutral-900/30 gap-4 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <div>
                Showing <span className="font-semibold text-neutral-700 dark:text-neutral-300">{totalItemsCount > 0 ? startIndex + 1 : 0}</span> to{" "}
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{endIndex}</span> of{" "}
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{totalItemsCount}</span> entries
              </div>
              <div className="flex items-center gap-1.5 sm:border-l sm:border-neutral-200 dark:sm:border-neutral-800 sm:pl-4">
                <span>Page size:</span>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={pageSizeInputVal}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    setPageSizeInputVal(rawVal);
                    
                    const val = parseInt(rawVal, 10);
                    if (!isNaN(val) && val >= 5) {
                      setActivePageSize(val);
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val < 5) {
                      setActivePageSize(5);
                      setPageSizeInputVal("5");
                    } else {
                      setPageSizeInputVal(val.toString());
                    }
                  }}
                  className="w-16 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-center text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                onClick={() => setActiveCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={activePage === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </Button>
              {/* Dynamically render page numbers */}
              {getPageNumbers().map((pageNumber, idx) => {
                if (pageNumber === "...") {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="px-1 text-neutral-400 text-xs select-none"
                    >
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setActiveCurrentPage(Number(pageNumber))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      activePage === pageNumber
                        ? "bg-blue-600 text-white font-medium"
                        : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <Button
                variant="ghost"
                onClick={() => setActiveCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={activePage === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
