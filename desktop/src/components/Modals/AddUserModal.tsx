import { useState, useEffect } from "react"
import Modal from "../Modal"
import { z } from "zod"
import { useCreateUser } from "@/commands/user/create-user.command"
import { showToast } from "@/components/Toast"
import { UserRoles } from "@/types/userRoles"
import { Input } from "../Input"

const userSchema = z.object({
    name: z.string()
        .min(1, { message: "Name is required" })
        .transform((val) => val.trim()),
    email: z.string()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email address" })
        .transform((val) => val.trim()),
    role: z.nativeEnum(UserRoles, { message: "Please select a valid role" }),
    active: z.boolean(),
});

export const AddUserModal = ({
    visible,
    onClose,
} : {
    visible: boolean;
    onClose: () => void;
}) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<UserRoles>(UserRoles.customer);
    const [active, setActive] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const createUserMutation = useCreateUser();
    const loading = createUserMutation.isPending;

    // Reset form state when modal becomes visible or invisible
    useEffect(() => {
        if (!visible) {
            setName("");
            setEmail("");
            setRole(UserRoles.customer);
            setActive(true);
            setError(null);
            createUserMutation.reset();
        }
    }, [visible]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const validation = userSchema.safeParse({ name, email, role, active });
        if (!validation.success) {
            const firstError = validation.error.issues[0]?.message || "Invalid input";
            setError(firstError);
            return;
        }

        const validatedData = validation.data;
        setError(null);

        try {
            await createUserMutation.mutateAsync({
                name: validatedData.name,
                email: validatedData.email,
                role: validatedData.role,
                active: validatedData.active,
            });
            showToast("User added successfully", { variant: "success" });
            onClose();
        } catch (err) {
            showToast("Failed to add user", {
                description: "An error occurred while creating the user.",
                variant: "error"
            });
            setError("Failed to add user. Please try again.");
        }
    };

    return (
        <Modal 
            visible={visible} 
            onClose={onClose}
            title="Add New User"
            subtitle="Enter user details below to register a new user in the system."
            icon={(
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            color="blue"
            primaryButtonDetails={{
                label: loading ? "Adding..." : "Add User",
                onClick: handleSubmit,
                color: "blue",
            }}
            secondaryButtonDetails={{
                label: "Cancel",
                onClick: onClose,
                color: "gray",
            }}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    disabled={loading}
                    variant="outlined"
                    colorScheme="blue"
                    required
                />

                <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@example.com"
                    disabled={loading}
                    variant="outlined"
                    colorScheme="blue"
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Role
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRoles)}
                        disabled={loading}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                        required
                    >
                        <option value={UserRoles.customer}>Customer</option>
                        <option value={UserRoles.manager}>Manager</option>
                        <option value={UserRoles.waiter}>Waiter</option>
                        <option value={UserRoles.chef}>Chef</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        disabled={loading}
                        id="user-active"
                        className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="user-active" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
                        Active Account (Allow Login/Access)
                    </label>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </form>
        </Modal>
    )
}