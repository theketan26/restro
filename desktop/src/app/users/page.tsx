"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useAddModal } from "@/hooks/useAddModal";
import { useUsers } from "@/queries/user/use-users.query";
import { useUpdateUser } from "@/commands/user/update-user.command";
import { EditUserModal } from "@/components/Modals/EditUserModal";
import { DeleteUserModal } from "@/components/Modals/DeleteUserModal";
import type { User } from "@/domain/models/user";
import { UserRoles } from "@/types/userRoles";
import { useUIStore } from "@/store/ui.store";
import { showToast } from "@/components/Toast";
import { Table, TableColumn, TableFilter } from "@/components/Table";

const ITEMS_PER_PAGE = 20;

export default function UsersPage() {
  const router = useRouter();
  const { userRole } = useUIStore();
  const [checking, setChecking] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Search, filter, and page states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "active",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  // Debounce search term to avoid excessive API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const activeRole = !userRole || userRole === "undefined" || userRole === "null" ? "admin" : userRole;

  useEffect(() => {
    if (activeRole !== "admin" && activeRole !== "manager") {
      router.push("/");
      showToast("Access Denied", {
        description: "Only admin and manager roles can access the users management screen.",
        variant: "error"
      });
    } else {
      setChecking(false);
    }
  }, [activeRole, router]);

  // Load users using TanStack Query. staleTime: 0 ensures refetch occurs on mount when visiting screen
  const { data, isLoading, error } = useUsers(
    {
      search: debouncedSearch,
      role: filterValues.role || "all",
      status: filterValues.status || "active",
      page: currentPage,
      limit: Math.max(5, pageSize),
    },
    { staleTime: 0 }
  );

  const usersList = data?.users || [];
  const totalUsers = data?.total || 0;
  const totalUnfiltered = data?.totalUnfiltered || 0;

  const { handleOpenAddUserModal, AddUserModalComponent } = useAddModal();
  const updateUserMutation = useUpdateUser();

  const columns: TableColumn<User>[] = [
    {
      header: "Name",
      accessorKey: "name",
      className: "font-medium text-neutral-900 dark:text-white flex items-center gap-3",
      render: (user) => (
        <>
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
            {user.name.charAt(0)}
          </div>
          <span>{user.name}</span>
        </>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Role",
      accessorKey: "role",
      render: (user) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${user.role === UserRoles.admin
            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50"
            : user.role === UserRoles.manager
              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50"
              : user.role === UserRoles.chef
                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                : user.role === UserRoles.waiter
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50" // customer
          }`}>
          {user.role}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "active",
      render: (user) => {
        const isActive = user.active !== false;
        const isPending = updateUserMutation.isPending && updateUserMutation.variables?.id === user.id;

        const handleToggle = async () => {
          if (user.role === UserRoles.admin) {
            showToast("Cannot modify admin status", { variant: "error" });
            return;
          }
          try {
            await updateUserMutation.mutateAsync({
              id: user.id,
              active: !isActive,
            });
            showToast("User status updated successfully", { variant: "success" });
          } catch (err) {
            showToast("Failed to update status", { variant: "error" });
          }
        };

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              disabled={isPending || user.role === UserRoles.admin}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                isActive ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-800"
              }`}
              role="switch"
              aria-checked={isActive}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 w-16">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Created At",
      accessorKey: "createdAt",
      render: (user) => (
        <>
          {new Date(user.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (user) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setEditingUser(user)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:text-neutral-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/30 transition"
            title="Edit User"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => setDeletingUser(user)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:text-neutral-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition"
            title="Delete User"
            disabled={user.role === UserRoles.admin}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  const filters: TableFilter<User>[] = [
    {
      key: "status" as any,
      label: "Status",
      options: [
        { label: "Active Only", value: "active" },
        { label: "Inactive Only", value: "inactive" },
        { label: "All Statuses", value: "all" },
      ],
    },
    {
      key: "role",
      label: "Role",
      options: [
        { label: "Admin", value: UserRoles.admin },
        { label: "Manager", value: UserRoles.manager },
        { label: "Chef", value: UserRoles.chef },
        { label: "Waiter", value: UserRoles.waiter },
        { label: "Customer", value: UserRoles.customer },
      ],
    },
  ];

  if (checking || (activeRole !== "admin" && activeRole !== "manager")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Verifying authorization...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div>
          <Text className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            All Users
          </Text>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your restaurant team members and permissions.
          </p>
        </div>
        <Button
          onClick={handleOpenAddUserModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New User
        </Button>
      </div>

      <Table<User>
        serverSide
        data={usersList}
        totalItems={totalUsers}
        totalUnfiltered={totalUnfiltered}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={pageSize}
        onItemsPerPageChange={setPageSize}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
        columns={columns}
        searchableFields={["name", "email"]}
        searchPlaceholder="Search by name or email..."
        filters={filters}
        isLoading={isLoading}
        error={error}
        emptyState={
          <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/20">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No users registered</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
              Get started by adding team members, staff accounts or administrators to Stackrise.
            </p>
            <Button
              onClick={handleOpenAddUserModal}
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition duration-200 shadow-sm"
            >
              Add First User
            </Button>
          </div>
        }
      />

      {AddUserModalComponent}
      <EditUserModal
        user={editingUser}
        visible={!!editingUser}
        onClose={() => setEditingUser(null)}
      />
      <DeleteUserModal
        user={deletingUser}
        visible={!!deletingUser}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
}
