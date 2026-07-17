import { useState } from "react"
import { createPortal } from "react-dom"
import { AddUserModal } from "@/components/Modals/AddUserModal"

export const useAddModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenAddUserModal = () => {
        setIsOpen(true);
    }

    const handleCloseAddUserModal = () => {
        setIsOpen(false);
    }

    const AddUserModalComponent = (isOpen && typeof window !== "undefined")
        ? createPortal(
            <AddUserModal 
                visible={isOpen} 
                onClose={handleCloseAddUserModal} 
            />,
            document.body
          )
        : null;

    return {
        handleOpenAddUserModal,
        AddUserModalComponent,
    }
}