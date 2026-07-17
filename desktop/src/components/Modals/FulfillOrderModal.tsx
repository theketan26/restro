"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import { Button } from "../Button";
import { useFulfillOrderToken } from "@/commands/order-token/fulfill-order-token.command";
import { showToast } from "@/components/Toast";
import type { Order, OrderToken } from "@/domain/models/order";
import { BiCreditCard, BiMoney, BiMobileAlt, BiCalculator } from "react-icons/bi";

interface AggregatedItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export const FulfillOrderModal = ({
  visible,
  onClose,
  token,
  orders,
}: {
  visible: boolean;
  onClose: () => void;
  token: OrderToken | null;
  orders: Order[];
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile">("cash");
  const [amountPaidString, setAmountPaidString] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fulfillMutation = useFulfillOrderToken();
  const loading = fulfillMutation.isPending;

  // Aggregate items from all orders under this token
  const aggregatedItems: AggregatedItem[] = [];
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = aggregatedItems.find((i) => i.itemId === item.itemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        aggregatedItems.push({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        });
      }
    });
  });

  const totalAmount = aggregatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Set default amount paid when token or orders change
  useEffect(() => {
    if (visible && totalAmount > 0) {
      setAmountPaidString(totalAmount.toFixed(2));
      setPaymentMethod("cash");
      setError(null);
    }
  }, [visible, totalAmount]);

  const handleSubmit = async () => {
    if (!token) return;

    const amountPaid = parseFloat(amountPaidString);
    if (isNaN(amountPaid) || amountPaid < totalAmount) {
      setError(`Amount paid must be at least the total amount ($${totalAmount.toFixed(2)}).`);
      return;
    }

    try {
      await fulfillMutation.mutateAsync({
        tokenId: token.id,
        paymentMethod,
        amountPaid,
      });
      showToast("Transaction Completed", {
        description: `${token.tableNumber} order token has been fulfilled. A new active token was automatically created.`,
        variant: "success",
      });
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Transaction Failed", {
        description: "An error occurred while fulfilling the order token.",
        variant: "error",
      });
      setError("Failed to complete transaction. Please try again.");
    }
  };

  if (!token) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`Fulfill Table - ${token.tableNumber}`}
      subtitle={`Complete payment transaction for Token ID: ${token.id.slice(0, 8)}...`}
      icon={<BiCalculator className="w-6 h-6" />}
      color="green"
      primaryButtonDetails={{
        label: loading ? "Completing Transaction..." : "Complete & Fulfill",
        onClick: handleSubmit,
        color: "green",
      }}
      secondaryButtonDetails={{
        label: "Cancel",
        onClick: onClose,
        color: "gray",
      }}
    >
      <div className="w-[500px] max-w-full space-y-5">
        {/* Bill Summary */}
        <div className="bg-neutral-50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Bill Summary
          </h4>
          <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {aggregatedItems.map((item) => (
              <div key={item.itemId} className="flex justify-between items-center text-sm">
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {item.name} <span className="text-xs text-neutral-400">x{item.quantity}</span>
                </span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-neutral-200 dark:border-neutral-800 pt-3 flex justify-between items-center font-bold text-sm">
            <span className="text-neutral-800 dark:text-neutral-200">Total Bill Amount</span>
            <span className="text-lg text-neutral-950 dark:text-white">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "cash", label: "Cash", icon: <BiMoney className="w-5 h-5" /> },
              { id: "card", label: "Card", icon: <BiCreditCard className="w-5 h-5" /> },
              { id: "mobile", label: "Mobile / UPI", icon: <BiMobileAlt className="w-5 h-5" /> },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as any)}
                className={`py-3.5 px-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all font-semibold text-xs ${
                  paymentMethod === method.id
                    ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-950/20 dark:border-green-400 dark:text-green-400"
                    : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-850 dark:text-neutral-300"
                }`}
              >
                {method.icon}
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Paid Input */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Amount Tendered / Paid
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm select-none">
              $
            </span>
            <input
              type="number"
              step="0.01"
              value={amountPaidString}
              onChange={(e) => setAmountPaidString(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm text-neutral-800 dark:text-white dark:bg-neutral-900 dark:border-neutral-700 outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="0.00"
            />
          </div>
          {parseFloat(amountPaidString) > totalAmount && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              Change: ${(parseFloat(amountPaidString) - totalAmount).toFixed(2)}
            </p>
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
