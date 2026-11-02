import { UserRoles } from "@/types/userRoles"
import { AddUserModal } from "@/components/Modals/AddUserModal"
import { createPortal } from "react-dom";
import { useState } from "react";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1"}:${process.env.NEXT_PUBLIC_API_BASE_PORT || "2326"}`;

export const useAddModal = () => {
    const [addModalOpen, setAddModalOpen] = useState(false);

    const handleCreateNewUser = async (name: string, email: string, role: UserRoles) => {
        if (!name.trim() || !email.trim()) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });
            if (res.ok) {
                return {
                    status: true,
                    message: "User created successfully",
                };
            } else {
                throw "Failed";
            }
        } catch (e) {
            return {
                status: false,
                message: "Failed to create user",
            };
        }
    }

    const AddUserModalRenderer = () => {
        if (addModalOpen) {
            return createPortal(
                <AddUserModal onclose={() => setAddModalOpen(false)} />,
                document.body
            )
        } else {
            return null
        }
    }

    return {
        handleCreateNewUser,
        handleOpenAddUserModal,
    }
}