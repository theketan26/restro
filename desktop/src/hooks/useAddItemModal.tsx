import { useState } from "react"
import { createPortal } from "react-dom"
import { AddItemModal } from "@/components/Modals/AddItemModal"

export const useAddItemModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenAddItemModal = () => {
        setIsOpen(true);
    }

    const handleCloseAddItemModal = () => {
        setIsOpen(false);
    }

    const AddItemModalComponent = (isOpen && typeof window !== "undefined")
        ? createPortal(
            <AddItemModal 
                visible={isOpen} 
                onClose={handleCloseAddItemModal} 
            />,
            document.body
          )
        : null;

    return {
        handleOpenAddItemModal,
        AddItemModalComponent,
    }
}
