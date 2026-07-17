import { useState, useEffect } from "react"
import Modal from "../Modal"
import { useDeleteItem } from "@/commands/item/delete-item.command"
import type { Item } from "@/domain/models/item"
import { showToast } from "@/components/Toast"

export const DeleteItemModal = ({
    item,
    visible,
    onClose,
} : {
    item: Item | null;
    visible: boolean;
    onClose: () => void;
}) => {
    const [error, setError] = useState<string | null>(null);
    const deleteMutation = useDeleteItem();
    const loading = deleteMutation.isPending;

    // Reset error when modal visibility changes
    useEffect(() => {
        if (!visible) {
            setError(null);
            deleteMutation.reset();
        }
    }, [visible]);

    const handleDelete = async () => {
        if (!item) return;
        
        setError(null);
        try {
            await deleteMutation.mutateAsync(item.id);
            showToast("Item deleted successfully", { variant: "success" });
            onClose();
        } catch (err) {
            showToast("Failed to delete item", {
                description: "An error occurred while deleting the menu item.",
                variant: "error"
            });
            setError("Failed to delete item. Please try again.");
        }
    };

    return (
        <Modal 
            visible={visible} 
            onClose={onClose}
            title="Delete Menu Item"
            subtitle={`Are you sure you want to delete "${item?.name || "this item"}"? This action cannot be undone and will permanently remove it from the menu.`}
            icon={(
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            )}
            color="red"
            primaryButtonDetails={{
                label: loading ? "Deleting..." : "Delete Item",
                onClick: handleDelete,
                color: "red",
            }}
            secondaryButtonDetails={{
                label: "Cancel",
                onClick: onClose,
                color: "gray",
            }}
        >
            <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Item: <span className="font-semibold text-neutral-900 dark:text-white">{item?.name}</span> ({item?.category})
                </p>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </Modal>
    )
}
