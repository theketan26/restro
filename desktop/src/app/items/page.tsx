"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useAddItemModal } from "@/hooks/useAddItemModal";
import { useItems } from "@/queries/item/use-items.query";
import { useUpdateItem } from "@/commands/item/update-item.command";
import { EditItemModal } from "@/components/Modals/EditItemModal";
import { DeleteItemModal } from "@/components/Modals/DeleteItemModal";
import { ViewItemModal } from "@/components/Modals/ViewItemModal";
import type { Item } from "@/domain/models/item";
import { useUIStore } from "@/store/ui.store";
import { showToast } from "@/components/Toast";
import { Table, TableColumn, TableFilter } from "@/components/Table";
import { httpClient } from "@/infrastructure/http/axios-client";

const ITEMS_PER_PAGE = 20;

export default function ItemsPage() {
  const router = useRouter();
  const { userRole } = useUIStore();
  const [checking, setChecking] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [viewingItem, setViewingItem] = useState<Item | null>(null);

  // Search, filter, and page states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  // Debounce search term to avoid excessive API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const activeRole = !userRole || userRole === "undefined" || userRole === "null" ? "admin" : userRole;

  useEffect(() => {
    if (activeRole !== "admin" && activeRole !== "manager" && activeRole !== "chef") {
      router.push("/");
      showToast("Access Denied", {
        description: "Only admin, manager, and chef roles can access the menu items management screen.",
        variant: "error"
      });
    } else {
      setChecking(false);
    }
  }, [activeRole, router]);

  // Load items using TanStack Query. staleTime: 0 ensures refetch occurs on mount when visiting screen
  const { data, isLoading, error } = useItems(
    {
      search: debouncedSearch,
      category: filterValues.category || "all",
      diet: filterValues.diet || "all",
      page: currentPage,
      limit: Math.max(5, pageSize),
    },
    { staleTime: 0 }
  );

  const itemsList = data?.items || [];
  const totalItems = data?.total || 0;
  const totalUnfiltered = data?.totalUnfiltered || 0;

  const { handleOpenAddItemModal, AddItemModalComponent } = useAddItemModal();
  const updateItemMutation = useUpdateItem();

  // Helper to format image url from server relative path
  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("data:")) return path;
    const apiBase = httpClient.defaults.baseURL || "http://127.0.0.1:2326/api";
    const root = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
    return `${root}${path}`;
  };

  const columns: TableColumn<Item>[] = [
    {
      header: "Name",
      accessorKey: "name",
      className: "font-medium text-neutral-900 dark:text-white flex items-center gap-3",
      render: (item) => (
        <>
          {item.image ? (
            <img
              src={getImageUrl(item.image)}
              alt={item.name}
              className="w-10 h-10 rounded-xl object-cover border border-neutral-100 dark:border-neutral-800 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm uppercase shrink-0">
              {item.name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold">{item.name}</span>
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded border text-[9px] font-black shrink-0 ${
                item.diet === "veg"
                  ? "border-green-600 text-green-600 bg-green-50/30 dark:bg-green-950/20"
                  : item.diet === "egg"
                    ? "border-amber-500 text-amber-500 bg-amber-50/30 dark:bg-amber-950/20"
                    : "border-red-600 text-red-600 bg-red-50/30 dark:bg-red-950/20"
              }`} title={item.diet === "veg" ? "Veg" : item.diet === "egg" ? "Contains Egg" : "Non-Veg"}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  item.diet === "veg" ? "bg-green-600" : item.diet === "egg" ? "bg-amber-500" : "bg-red-600"
                }`} />
              </span>
            </div>
          </div>
        </>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      className: "font-semibold text-neutral-900 dark:text-white",
      render: (item) => <>${item.price.toFixed(2)}</>,
    },
    {
      header: "Category",
      accessorKey: "category",
      render: (item) => {
        const cat = item.category || "General";
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${
            cat === "Starters"
              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
              : cat === "Mains"
                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50"
                : cat === "Sides"
                  ? "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900/50"
                  : cat === "Desserts"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                    : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50" // Beverages
          }`}>
            {cat}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "available",
      render: (item) => {
        const isAvailable = item.available !== false;
        const isPending = updateItemMutation.isPending && updateItemMutation.variables?.id === item.id;

        const handleToggle = async () => {
          try {
            await updateItemMutation.mutateAsync({
              id: item.id,
              available: !isAvailable,
            });
            showToast("Availability updated successfully", { variant: "success" });
          } catch (err) {
            showToast("Failed to update availability", {
              description: "An error occurred while updating the menu item.",
              variant: "error",
            });
          }
        };

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={isPending}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                isAvailable ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-800"
              }`}
              role="switch"
              aria-checked={isAvailable}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAvailable ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 w-16">
              {isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setViewingItem(item)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-neutral-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/30 transition"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => setEditingItem(item)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:text-neutral-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 transition"
            title="Edit Item"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => setDeletingItem(item)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:text-neutral-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition"
            title="Delete Item"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  const filters: TableFilter<Item>[] = [
    {
      key: "diet" as any,
      label: "Diet",
      options: [
        { label: "Vegetarian (Veg)", value: "veg" },
        { label: "Non-Vegetarian (Non-Veg)", value: "non-veg" },
        { label: "Eggitarian (Egg)", value: "egg" },
      ],
    },
    {
      key: "category",
      label: "Category",
      options: [
        { label: "Starters", value: "Starters" },
        { label: "Mains", value: "Mains" },
        { label: "Sides", value: "Sides" },
        { label: "Desserts", value: "Desserts" },
        { label: "Beverages", value: "Beverages" },
      ],
    },
  ];

  if (checking || (activeRole !== "admin" && activeRole !== "manager" && activeRole !== "chef")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Verifying authorization...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div>
          <Text className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Menu Items
          </Text>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your restaurant dishes, drinks, categories, prices, and availability.
          </p>
        </div>
        <Button
          onClick={handleOpenAddItemModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Item
        </Button>
      </div>

      <Table<Item>
        serverSide
        data={itemsList}
        totalItems={totalItems}
        totalUnfiltered={totalUnfiltered}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={pageSize}
        onItemsPerPageChange={setPageSize}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
        columns={columns}
        searchableFields={["name", "description"]}
        searchPlaceholder="Search by name, description, taste, or ingredients..."
        filters={filters}
        isLoading={isLoading}
        error={error}
        emptyState={
          <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/20">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No items registered</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
              Get started by adding starters, mains, desserts, or beverages to Stackrise.
            </p>
            <Button
              onClick={handleOpenAddItemModal}
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition duration-200 shadow-sm"
            >
              Add First Item
            </Button>
          </div>
        }
      />

      {AddItemModalComponent}
      <EditItemModal
        item={editingItem}
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
      />
      <DeleteItemModal
        item={deletingItem}
        visible={!!deletingItem}
        onClose={() => setDeletingItem(null)}
      />
      <ViewItemModal
        item={viewingItem}
        visible={!!viewingItem}
        onClose={() => setViewingItem(null)}
      />
    </div>
  );
}
