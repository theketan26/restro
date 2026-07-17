import { useState, useEffect } from "react"
import Modal from "../Modal"
import { z } from "zod"
import { useUpdateUser } from "@/commands/user/update-user.command"
import type { User } from "@/domain/models/user"
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

export const EditUserModal = ({
    user,
    visible,
    onClose,
} : {
    user: User | null;
    visible: boolean;
    onClose: () => void;
}) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<UserRoles>(UserRoles.customer);
    const [active, setActive] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const updateUserMutation = useUpdateUser();
    const loading = updateUserMutation.isPending;

    // Populate form fields when user prop changes
    useEffect(() => {
        if (user && visible) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role || UserRoles.customer);
            setActive(user.active !== false);
            setError(null);
            updateUserMutation.reset();
        }
    }, [user, visible]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;
        
        const validation = userSchema.safeParse({ name, email, role, active });
        if (!validation.success) {
            const firstError = validation.error.issues[0]?.message || "Invalid input";
            setError(firstError);
            return;
        }

        const validatedData = validation.data;
        setError(null);

        try {
            await updateUserMutation.mutateAsync({
                id: user.id,
                name: validatedData.name,
                email: validatedData.email,
                role: validatedData.role,
                active: validatedData.active,
            });
            showToast("User updated successfully", { variant: "success" });
            onClose();
        } catch (err) {
            showToast("Failed to update user", {
                description: "An error occurred while saving user changes.",
                variant: "error"
            });
            setError("Failed to update user. Please try again.");
        }
    };

    return (
        <Modal 
            visible={visible} 
            onClose={onClose}
            title="Edit User Details"
            subtitle="Modify the fields below to update the user record."
            icon={(
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            )}
            color="indigo"
            primaryButtonDetails={{
                label: loading ? "Saving..." : "Save Changes",
                onClick: handleSubmit,
                color: "indigo",
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
                    colorScheme="indigo"
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
                    colorScheme="indigo"
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Role
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRoles)}
                        disabled={loading || role === UserRoles.admin}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 disabled:bg-neutral-50 dark:disabled:bg-neutral-800 disabled:text-neutral-500"
                        required
                    >
                        {role === UserRoles.admin && (
                            <option value={UserRoles.admin}>Admin</option>
                        )}
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
                        id="user-active-edit"
                        className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="user-active-edit" className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">
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
