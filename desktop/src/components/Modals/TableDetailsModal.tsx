"use client";

import React from "react";
import Modal from "../Modal";
import { Button } from "../Button";
import type { Order, OrderToken } from "@/domain/models/order";
import { BiCoffeeTogo, BiTime, BiCheckCircle, BiDetail } from "react-icons/bi";
import { useUIStore } from "@/store/ui.store";

interface AggregatedItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export const TableDetailsModal = ({
  visible,
  onClose,
  tableName,
  token,
  orders,
  onAddOrder,
  onFulfill,
}: {
  visible: boolean;
  onClose: () => void;
  tableName: string;
  token: OrderToken | null;
  orders: Order[];
  onAddOrder: () => void;
  onFulfill: () => void;
}) => {
  const { userRole } = useUIStore();
  // Aggregate items
  const aggregatedItems: AggregatedItem[] = [];
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = aggregatedItems.find(
        (i) => i.itemId === item.itemId && (i.note || "") === (item.note || "")
      );
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        aggregatedItems.push({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          note: item.note,
        });
      }
    });
  });

  const totalBill = aggregatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`${tableName} Details`}
      subtitle={token ? `Active Token ID: ${token.id.slice(0, 8)}...` : "Table is currently unoccupied."}
      icon={<BiCoffeeTogo className="w-6 h-6" />}
      color="indigo"
      actionChildren={
        <div className="flex justify-between items-center mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-850">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {userRole !== "chef" && (
            <div className="flex gap-2">
              <Button variant="primary" onClick={onAddOrder} className="bg-indigo-600 hover:bg-indigo-700">
                Add Order
              </Button>
              {token && orders.length > 0 && (
                <Button variant="success" onClick={onFulfill}>
                  Fulfill Table
                </Button>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="w-[600px] max-w-full space-y-5">
        {token && (
          <div className="flex items-center justify-between text-sm bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4">
            <span className="font-semibold text-neutral-600 dark:text-neutral-400">
              Assigned Chef
            </span>
            <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 bg-white dark:bg-neutral-950 px-3 py-1 rounded-xl shadow-sm border border-neutral-150 dark:border-neutral-850">
              👨‍🍳 {token.chefName || "Unassigned"}
              {token.chefStatus && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  token.chefStatus === "completed"
                    ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50"
                    : token.chefStatus === "cooking"
                    ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                    : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50"
                }`}>
                  {token.chefStatus}
                </span>
              )}
            </span>
          </div>
        )}
        {orders.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400">
            <BiDetail className="w-10 h-10 mx-auto mb-2 opacity-50 text-neutral-300" />
            <p className="text-sm font-semibold">No Active Orders</p>
            <p className="text-xs text-neutral-400 mt-1">This table is free. Click "Add Order" to place a new order.</p>
          </div>
        ) : (
          <>
            {/* Aggregated Bill Summary */}
            <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
                Items Summary
              </h4>
              <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {aggregatedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex flex-col min-w-0 pr-3">
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                        {item.name} <span className="text-xs text-neutral-400">x{item.quantity}</span>
                      </span>
                      {item.note && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                          Note: {item.note}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-100 shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-neutral-200 dark:border-neutral-850 mt-3 pt-3 flex justify-between items-center font-bold text-sm">
                <span className="text-neutral-800 dark:text-neutral-200">Current Total Bill</span>
                <span className="text-lg text-neutral-950 dark:text-white">
                  ${totalBill.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Individual Orders List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                Order History (Active Session)
              </h4>
              <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {orders.map((order, orderIdx) => (
                  <div
                    key={order.id}
                    className="p-3 border border-neutral-150 dark:border-neutral-850 rounded-xl bg-white dark:bg-neutral-950 flex flex-col space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Order #{orders.length - orderIdx}
                      </span>
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <BiTime className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-0.5 pl-1.5 border-l-2 border-indigo-500">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="text-xs flex justify-between text-neutral-600 dark:text-neutral-400">
                          <span>
                            {it.name} <span className="text-[10px] text-neutral-400">x{it.quantity}</span>
                          </span>
                          <span>${(it.price * it.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
