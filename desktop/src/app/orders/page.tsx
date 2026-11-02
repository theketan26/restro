"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Table, TableColumn } from "@/components/Table";
import { useOrderTokens } from "@/queries/order-token/use-order-tokens.query";
import { useOrders } from "@/queries/order/use-orders.query";
import { useTables } from "@/queries/table/use-tables.query";
import { useDeleteTable } from "@/commands/table/delete-table.command";
import { AddOrderModal } from "@/components/Modals/AddOrderModal";
import { FulfillOrderModal } from "@/components/Modals/FulfillOrderModal";
import { TableDetailsModal } from "@/components/Modals/TableDetailsModal";
import { TableEditModal } from "@/components/Modals/TableEditModal";
import type { Order, OrderToken } from "@/domain/models/order";
import type { RestaurantTable } from "@/domain/models/table";
import { showToast } from "@/components/Toast";
import { BiHistory, BiPlus, BiCoffeeTogo, BiTrash, BiEditAlt } from "react-icons/bi";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateOrderTokenChef } from "@/commands/order-token/update-order-token.command";
import { useUsers } from "@/queries/user/use-users.query";
import { UserRoles } from "@/types/userRoles";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"tables" | "history">("tables");
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [isFulfillOpen, setIsFulfillOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);

  const [selectedTable, setSelectedTable] = useState<string | undefined>(undefined);
  const [selectedTokenForFulfill, setSelectedTokenForFulfill] = useState<OrderToken | null>(null);
  const [selectedOrdersForFulfill, setSelectedOrdersForFulfill] = useState<Order[]>([]);

  const [selectedTokenForDetails, setSelectedTokenForDetails] = useState<OrderToken | null>(null);
  const [selectedOrdersForDetails, setSelectedOrdersForDetails] = useState<Order[]>([]);

  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);

  // TanStack Query hooks
  const { data: tokens = [], isLoading: tokensLoading } = useOrderTokens({ staleTime: 0 });
  const { data: orders = [], isLoading: ordersLoading } = useOrders({ staleTime: 0 });
  const { data: tables = [], isLoading: tablesLoading } = useTables({ staleTime: 0 });

  const { userRole, activeChefId } = useUIStore();
  const { authUser } = useAuthStore();
  const updateChefMutation = useUpdateOrderTokenChef();
  const { data: chefsData } = useUsers(
    { role: "chef", status: "active" },
    { enabled: userRole === "chef" || userRole === "admin" || userRole === "manager" }
  );
  const chefs = chefsData?.users || [];
  const activeChef = chefs.find((c) => c.id === activeChefId);
  const currentChefName = activeChef ? activeChef.name : (authUser?.name || "Chef");

  const deleteTableMutation = useDeleteTable();

  const activeTokens = tokens.filter((t) => t.status === "active");
  const fulfilledTokens = tokens.filter((t) => t.status === "fulfilled");

  const handleAddOrderClick = (tableNumber: string) => {
    setSelectedTable(tableNumber);
    setIsAddOrderOpen(true);
  };

  const handleFulfillClick = (token: OrderToken, tableOrders: Order[]) => {
    setSelectedTokenForFulfill(token);
    setSelectedOrdersForFulfill(tableOrders);
    setIsFulfillOpen(true);
  };

  const handleViewDetails = (tableName: string, token: OrderToken | null, tableOrders: Order[]) => {
    setSelectedTable(tableName);
    setSelectedTokenForDetails(token);
    setSelectedOrdersForDetails(tableOrders);
    setIsDetailsOpen(true);
  };

  const handleAddTableClick = () => {
    setEditingTable(null);
    setIsEditTableOpen(true);
  };

  const handleEditTableClick = (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTable(table);
    setIsEditTableOpen(true);
  };

  const handleDeleteTableClick = async (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${table.name}?`)) {
      try {
        await deleteTableMutation.mutateAsync(table.id);
        showToast("Table deleted", {
          description: `${table.name} has been removed.`,
          variant: "success",
        });
      } catch (err) {
        showToast("Failed to delete table", {
          description: "An error occurred while deleting the table.",
          variant: "error",
        });
      }
    }
  };

  // Define Columns for Fulfillment History Table
  const historyColumns: TableColumn<OrderToken>[] = [
    {
      header: "Table",
      accessorKey: "tableNumber",
      className: "font-semibold text-neutral-900 dark:text-white",
    },
    {
      header: "Token ID",
      accessorKey: "id",
      render: (token) => <span className="font-mono text-xs">{token.id.slice(0, 8)}...</span>,
    },
    {
      header: "Payment Method",
      accessorKey: "paymentMethod",
      render: (token) => (
        <span className="capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200">
          {token.paymentMethod || "N/A"}
        </span>
      ),
    },
    {
      header: "Amount Paid",
      accessorKey: "amountPaid",
      className: "font-bold text-neutral-900 dark:text-white",
      render: (token) => <>${(token.amountPaid || 0).toFixed(2)}</>,
    },
    {
      header: "Fulfilled At",
      accessorKey: "fulfilledAt",
      render: (token) =>
        token.fulfilledAt ? new Date(token.fulfilledAt).toLocaleString() : "N/A",
    },
    {
      header: "Status",
      accessorKey: "status",
      render: (token) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50/50 text-green-700 border border-green-200/50 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          Paid & Complete
        </span>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5 gap-4">
        <div className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-950 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("tables")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "tables"
                ? "bg-indigo-600 text-white"
                : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-tertiary-100"
            }`}
          >
            <BiCoffeeTogo className="w-4 h-4" /> Active Tables
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "history"
                ? "bg-indigo-600 text-white"
                : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-tertiary-100"
            }`}
          >
            <BiHistory className="w-4 h-4" /> Fulfillment History
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "tables" && (
            <Button
              onClick={handleAddTableClick}
              variant="secondary"
              className="flex items-center gap-1.5 border border-indigo-200 hover:border-indigo-300 dark:border-indigo-900 dark:hover:border-indigo-800 font-semibold"
            >
              <BiPlus className="w-4 h-4" /> Add Table
            </Button>
          )}
          {userRole !== UserRoles.chef && (
            <Button
              onClick={() => handleAddOrderClick(tables[0]?.name || "Table 1")}
              variant="primary"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 font-semibold"
            >
              <BiPlus className="w-4 h-4" /> Place New Order
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {tokensLoading || ordersLoading || tablesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 animate-pulse">Loading orders and tables...</p>
          </div>
        ) : activeTab === "tables" ? (
          tables.length === 0 ? (
            <div className="border border-dashed border-neutral-200 dark:border-neutral-850 rounded-3xl p-16 text-center flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/10">
              <BiCoffeeTogo className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-4" />
              <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No tables configured</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2 mb-6">
                Get started by adding restaurant tables to your order board layout.
              </p>
              <Button onClick={handleAddTableClick} variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
                Create First Table
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
              {tables.map((table) => {
                const activeToken = activeTokens.find((t) => t.tableNumber === table.name);
                const tableOrders = activeToken
                  ? orders.filter((o) => o.tokenId === activeToken.id)
                  : [];

                // Aggregate items
                const aggregatedItems: Record<string, { name: string; quantity: number }> = {};
                tableOrders.forEach((o) => {
                  o.items.forEach((it) => {
                    if (aggregatedItems[it.itemId]) {
                      aggregatedItems[it.itemId].quantity += it.quantity;
                    } else {
                      aggregatedItems[it.itemId] = { name: it.name, quantity: it.quantity };
                    }
                  });
                });

                const itemsSummary = Object.values(aggregatedItems);
                const totalBill = tableOrders.reduce(
                  (acc, o) => acc + o.items.reduce((sum, it) => sum + it.price * it.quantity, 0),
                  0
                );
                const isOccupied = itemsSummary.length > 0;

                return (
                  <div
                    key={table.id}
                    onClick={() => handleViewDetails(table.name, activeToken || null, tableOrders)}
                    className={`rounded-2xl border transition-all p-5 flex flex-col justify-between h-[240px] bg-white dark:bg-neutral-950 cursor-pointer group hover:shadow-lg ${
                      isOccupied
                        ? "border-amber-200 shadow-md shadow-amber-500/5 ring-1 ring-amber-200/30 dark:border-amber-600/40 dark:ring-amber-500/10"
                        : "border-neutral-200 hover:border-neutral-300 dark:border-primary-800 hover:dark:border-primary-700/70"
                    }`}
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-neutral-900 dark:text-white truncate pr-2">
                          {table.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Manage table buttons - show only if table not occupied */}
                          {!isOccupied && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                onClick={(e) => handleEditTableClick(table, e)}
                                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-450 hover:text-indigo-600 dark:text-neutral-500 dark:hover:text-indigo-400 rounded"
                                title="Rename table"
                              >
                                <BiEditAlt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteTableClick(table, e)}
                                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-450 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-500 rounded"
                                title="Delete table"
                              >
                                <BiTrash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isOccupied
                                ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                : "bg-neutral-50 text-neutral-500 border border-neutral-200 dark:bg-primary-900/40 dark:text-primary-400 dark:border-primary-850"
                            }`}
                          >
                            {isOccupied ? "Occupied" : "Available"}
                          </span>
                        </div>
                      </div>

                      {activeToken && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 font-mono">
                            Token: {activeToken.id.slice(0, 8)}...
                          </p>
                          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/60 px-2 py-1 rounded-lg border border-neutral-100/50 dark:border-neutral-850/50">
                            <span className="truncate pr-1 flex items-center gap-1">
                              👨‍🍳 {activeToken.chefName || "Unassigned"}
                            </span>
                            {activeToken.chefStatus && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide shrink-0 ${
                                activeToken.chefStatus === "completed"
                                  ? "bg-green-50 text-green-755 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50"
                                  : activeToken.chefStatus === "cooking"
                                  ? "bg-amber-50 text-amber-700 border border-amber-250 animate-pulse dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                  : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50"
                              }`}>
                                {activeToken.chefStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Body: Items ordered */}
                    <div className="my-4 flex-1 min-h-0 overflow-y-auto">
                      {isOccupied ? (
                        <div className="space-y-1 pr-1 scrollbar-thin">
                          {itemsSummary.slice(0, 3).map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-400">
                              <span className="truncate pr-2 font-medium">{it.name}</span>
                              <span className="font-semibold shrink-0">x{it.quantity}</span>
                            </div>
                          ))}
                          {itemsSummary.length > 3 && (
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">
                              + {itemsSummary.length - 3} more items...
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-neutral-400 dark:text-neutral-500 italic">
                          No active orders
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Total & Actions */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900/60 flex items-center justify-between">
                      <div>
                        {isOccupied && (
                          <>
                            <p className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                              Total Bill
                            </p>
                            <p className="text-sm font-black text-neutral-900 dark:text-white">
                              ${totalBill.toFixed(2)}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                        {userRole === UserRoles.chef ? (
                          isOccupied && activeToken && (
                            <>
                              {(!activeToken.chefName || activeToken.chefName !== currentChefName) ? (
                                <>
                                  <Button
                                    onClick={() => updateChefMutation.mutate({
                                      tokenId: activeToken.id,
                                      chefName: currentChefName,
                                      chefStatus: "starting"
                                    })}
                                    variant="primary"
                                    className="px-2 py-1 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-750 text-white"
                                  >
                                    Assign to Me
                                  </Button>
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      const selectedChef = chefs.find((c) => c.id === selectedId);
                                      if (selectedChef) {
                                        updateChefMutation.mutate({
                                          tokenId: activeToken.id,
                                          chefName: selectedChef.name,
                                          chefStatus: "starting"
                                        });
                                      }
                                    }}
                                    className="px-1.5 py-1 rounded border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-250 outline-none max-w-[100px] text-xs font-semibold"
                                  >
                                    <option value="" disabled>Assign...</option>
                                    {chefs.filter((c) => c.name !== currentChefName).map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </>
                              ) : (
                                <>
                                  {activeToken.chefStatus === "starting" && (
                                    <Button
                                      onClick={() => updateChefMutation.mutate({
                                        tokenId: activeToken.id,
                                        chefName: activeToken.chefName || null,
                                        chefStatus: "cooking"
                                      })}
                                      variant="primary"
                                      className="px-2 py-1 text-xs font-bold rounded bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                      Start cooking
                                    </Button>
                                  )}
                                  {activeToken.chefStatus === "cooking" && (
                                    <Button
                                      onClick={() => updateChefMutation.mutate({
                                        tokenId: activeToken.id,
                                        chefName: activeToken.chefName || null,
                                        chefStatus: "completed"
                                      })}
                                      variant="success"
                                      className="px-2 py-1.5 text-xs font-bold rounded bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Complete
                                    </Button>
                                  )}
                                  {activeToken.chefStatus === "completed" && (
                                    <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1 mr-1">
                                      Done! 🍳
                                    </span>
                                  )}
                                  
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const selectedId = e.target.value;
                                      const selectedChef = chefs.find((c) => c.id === selectedId);
                                      if (selectedChef) {
                                        updateChefMutation.mutate({
                                          tokenId: activeToken.id,
                                          chefName: selectedChef.name,
                                          chefStatus: "starting"
                                        });
                                      }
                                    }}
                                    className="px-1.5 py-1 rounded border border-neutral-250 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-250 outline-none max-w-[100px] text-xs font-semibold"
                                  >
                                    <option value="" disabled>Delegate...</option>
                                    {chefs.filter((c) => c.name !== currentChefName).map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </>
                              )}
                            </>
                          )
                        ) : (
                          <>
                            <Button
                              onClick={() => handleAddOrderClick(table.name)}
                              variant="secondary"
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              Add Order
                            </Button>
                            {isOccupied && activeToken && (
                              <Button
                                onClick={() => handleFulfillClick(activeToken, tableOrders)}
                                variant="primary"
                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                              >
                                Fulfill
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <Table<OrderToken>
            data={fulfilledTokens}
            columns={historyColumns}
            searchableFields={["tableNumber", "id", "paymentMethod"]}
            searchPlaceholder="Search history by Table or Token ID..."
            itemsPerPage={10}
            emptyState={
              <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/20">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                  <BiHistory className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No Fulfillments</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
                  Completed transaction history will appear here once orders are fulfilled.
                </p>
              </div>
            }
          />
        )}
      </div>

      {/* Modals */}
      <AddOrderModal
        visible={isAddOrderOpen}
        onClose={() => setIsAddOrderOpen(false)}
        initialTable={selectedTable}
      />

      <FulfillOrderModal
        visible={isFulfillOpen}
        onClose={() => setIsFulfillOpen(false)}
        token={selectedTokenForFulfill}
        orders={selectedOrdersForFulfill}
      />

      <TableDetailsModal
        visible={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        tableName={selectedTable || ""}
        token={selectedTokenForDetails}
        orders={selectedOrdersForDetails}
        onAddOrder={() => {
          setIsDetailsOpen(false);
          setIsAddOrderOpen(true);
        }}
        onFulfill={() => {
          setIsDetailsOpen(false);
          if (selectedTokenForDetails) {
            handleFulfillClick(selectedTokenForDetails, selectedOrdersForDetails);
          }
        }}
      />

      <TableEditModal
        visible={isEditTableOpen}
        onClose={() => setIsEditTableOpen(false)}
        table={editingTable}
      />
    </div>
  );
}
