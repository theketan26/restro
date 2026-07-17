"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import { Button } from "../Button";
import { useItems } from "@/queries/item/use-items.query";
import { useTables } from "@/queries/table/use-tables.query";
import { useCreateOrder } from "@/commands/order/create-order.command";
import { showToast } from "@/components/Toast";
import type { Item } from "@/domain/models/item";
import { BiTrash, BiPlus, BiMinus, BiReceipt } from "react-icons/bi";

interface SelectedItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export const AddOrderModal = ({
  visible,
  onClose,
  initialTable,
}: {
  visible: boolean;
  onClose: () => void;
  initialTable?: string;
}) => {
  const [tableNumber, setTableNumber] = useState("Table 1");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const createOrderMutation = useCreateOrder();
  const loading = createOrderMutation.isPending;

  // Load items
  const { data: itemsData, isLoading: itemsLoading } = useItems({
    limit: 100, // Fetch up to 100 items for selection
  });
  const items = itemsData?.items || [];

  const { data: tables = [] } = useTables();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setTableNumber(initialTable || tables[0]?.name || "Table 1");
      setSelectedItems([]);
      setError(null);
      setSearchQuery("");
      setIsDropdownOpen(false);
    }
  }, [visible, initialTable, tables]);

  // Filter and group items by category for the searchable dropdown
  const filteredItems = items.filter(
    (item) =>
      item.available &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const itemsByCategory = filteredItems.reduce<Record<string, Item[]>>((acc, item) => {
    const cat = item.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleAddItem = (item: Item) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.itemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { itemId: item.id, name: item.name, price: item.price, quantity: 1, note: "" },
      ];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((i) => {
          if (i.itemId === itemId) {
            const nextQty = i.quantity + delta;
            return { ...i, quantity: nextQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const handleUpdateNote = (itemId: string, note: string) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, note } : i))
    );
  };

  const calculateTotal = () => {
    return selectedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError("Please add at least one item to the order.");
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        tableNumber,
        items: selectedItems,
      });
      showToast("Order placed successfully", {
        description: `Order successfully added for ${tableNumber}`,
        variant: "success",
      });
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to place order", {
        description: "An error occurred while creating the order.",
        variant: "error",
      });
      setError("Failed to create order. Please try again.");
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Create New Order"
      subtitle="Select table and add items to place a new order."
      icon={<BiReceipt className="w-6 h-6" />}
      color="indigo"
      primaryButtonDetails={{
        label: loading ? "Placing Order..." : "Place Order",
        onClick: handleSubmit,
        color: "indigo",
      }}
      secondaryButtonDetails={{
        label: "Cancel",
        onClick: onClose,
        color: "gray",
      }}
    >
      <div className="min-w-xl max-w-full space-y-6">
        {/* Top Control Bar: Select Table & Choose Item Dropdown (Grid layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 dark:bg-neutral-900/30 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
          {/* Table Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              1. Select Table
            </label>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
            >
              {tables.map((tbl) => (
                <option key={tbl.id} value={tbl.name}>
                  {tbl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Item Dropdown Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              2. Add Menu Item (Searchable)
            </label>
            {itemsLoading ? (
              <div className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-400 dark:bg-neutral-900 dark:border-neutral-800">
                Loading items...
              </div>
            ) : (
              <div className="relative">
                {/* Backdrop to close dropdown when clicking outside */}
                {isDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                )}

                <div className="relative z-50">
                  <input
                    type="text"
                    placeholder="Search item label (e.g. Pizza, Salad, Pasta)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    disabled={loading}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-sm">
                    🔍
                  </div>
                </div>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950 scrollbar-thin">
                    {filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-xs italic text-neutral-450 dark:text-neutral-500">
                        No items found matching "{searchQuery}"
                      </div>
                    ) : (
                      Object.entries(itemsByCategory).map(([category, catItems]) => (
                        <div key={category} className="p-1 border-b border-neutral-100 dark:border-neutral-900/60 last:border-b-0">
                          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/30 rounded">
                            {category}
                          </div>
                          <div className="space-y-0.5 mt-1">
                            {catItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  handleAddItem(item);
                                  setSearchQuery("");
                                  setIsDropdownOpen(false);
                                }}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-colors"
                              >
                                <span>{item.name}</span>
                                <span className="text-xs text-neutral-450 dark:text-neutral-400">
                                  ${item.price.toFixed(2)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Items Table / List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <span>Current Items List</span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              {selectedItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </h4>

          <div className="border border-neutral-200 dark:border-neutral-850 rounded-2xl overflow-hidden bg-white dark:bg-neutral-950 p-4">
            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                <BiReceipt className="w-10 h-10 mb-2 opacity-50 text-neutral-300" />
                <p className="text-sm">No items added to order yet.</p>
                <p className="text-xs text-neutral-400 mt-1">Select an item from the dropdown above to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                {selectedItems.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex flex-col p-4 rounded-xl border border-neutral-205 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/10 hover:shadow-md transition-shadow justify-between space-y-3"
                  >
                    {/* Top Row: Name and Delete button */}
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate pr-2" title={item.name}>
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.itemId)}
                        className="text-neutral-400 hover:text-red-550 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                        title="Remove item"
                      >
                        <BiTrash className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Middle Row: Price & Quantity controls */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        <span>Unit: </span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900 w-24">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.itemId, -1)}
                          className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500 shrink-0"
                        >
                          <BiMinus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center text-xs font-semibold text-neutral-800 dark:text-neutral-100 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.itemId, 1)}
                          className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500 shrink-0"
                        >
                          <BiPlus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Note input */}
                    <div>
                      <textarea
                        rows={3}
                        value={item.note || ""}
                        onChange={(e) => handleUpdateNote(item.itemId, e.target.value)}
                        placeholder="Add cooking note (e.g. extra cheese)..."
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-800 dark:text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition resize-none"
                      />
                    </div>

                    {/* Total Row */}
                    <div className="flex justify-between items-center pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Subtotal</span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between px-2 pt-2">
              <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                Total Amount Due:
              </span>
              <span className="text-xl font-black text-neutral-900 dark:text-white">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
