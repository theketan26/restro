"use client";

import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import { Input } from "../Input";
import { useCreateTable } from "@/commands/table/create-table.command";
import { useUpdateTable } from "@/commands/table/update-table.command";
import { showToast } from "@/components/Toast";
import type { RestaurantTable } from "@/domain/models/table";
import { BiCoffeeTogo } from "react-icons/bi";

export const TableEditModal = ({
  visible,
  onClose,
  table,
}: {
  visible: boolean;
  onClose: () => void;
  table?: RestaurantTable | null;
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createTableMutation = useCreateTable();
  const updateTableMutation = useUpdateTable();

  const isEdit = !!table;
  const loading = createTableMutation.isPending || updateTableMutation.isPending;

  useEffect(() => {
    if (visible) {
      setName(table?.name || "");
      setError(null);
    }
  }, [visible, table]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Table label is required.");
      return;
    }

    try {
      if (isEdit && table) {
        await updateTableMutation.mutateAsync({
          id: table.id,
          name: trimmed,
        });
        showToast("Table updated successfully", {
          description: `Renamed to ${trimmed}`,
          variant: "success",
        });
      } else {
        await createTableMutation.mutateAsync({
          name: trimmed,
        });
        showToast("Table added successfully", {
          description: `Created table ${trimmed}`,
          variant: "success",
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Error saving table", {
        description: "An error occurred while saving the table configuration.",
        variant: "error",
      });
      setError("Failed to save table. Please try again.");
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEdit ? "Edit Table Label" : "Add New Table"}
      subtitle={isEdit ? "Update the label name for this table." : "Create a new table layout configuration."}
      icon={<BiCoffeeTogo className="w-6 h-6" />}
      color="indigo"
      primaryButtonDetails={{
        label: loading ? "Saving..." : isEdit ? "Update Label" : "Create Table",
        onClick: handleSubmit,
        color: "indigo",
      }}
      secondaryButtonDetails={{
        label: "Cancel",
        onClick: onClose,
        color: "gray",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4 w-[400px] max-w-full">
        <Input
          label="Table Label / Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Table 13, VIP Box, Bar Corner"
          disabled={loading}
          variant="outlined"
          colorScheme="indigo"
          required
        />

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 flex items-start gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </form>
    </Modal>
  );
};
