import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Mail, Phone, Globe, Trash2 } from 'lucide-react';
import { userApi } from '../api/users';
import { CreateUserModal } from '../components/CreateUserModal';
import type { CreateUserRequest, UserResponse } from '@notification-service/shared';

export function Users() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Fetch users with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', currentPage],
    queryFn: () => userApi.list({ page: currentPage, limit: 50 }),
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (userData: CreateUserRequest) => userApi.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
    },
    onError: (error: any) => {
      alert(`Failed to create user: ${error.response?.data?.error || error.message}`);
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => userApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      alert(`Failed to delete user: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleDelete = async (userId: string, userEmail?: string) => {
    if (confirm(`Are you sure you want to delete user ${userEmail || userId}? This action cannot be undone.`)) {
      await deleteMutation.mutateAsync(userId);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading users: {(error as Error).message}</div>;
  }

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage end users who receive notifications</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Stats */}
      {pagination && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            Showing <strong>{users.length}</strong> of <strong>{pagination.total}</strong> users
            {pagination.total > 0 && (
              <> (Page {pagination.page} of {pagination.totalPages})</>
            )}
          </p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Locale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Devices
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user: UserResponse) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.email || user.phoneNumber || user.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {user.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.phoneNumber && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{user.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Globe className="h-3 w-3" />
                    <span>{user.locale}</span>
                  </div>
                  {user.timezone && (
                    <div className="text-xs text-gray-500 mt-1">{user.timezone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm space-y-1">
                    {user.apnsTokens.length > 0 && (
                      <div className="text-gray-900">
                        Apple: <span className="font-medium">{user.apnsTokens.length}</span>
                      </div>
                    )}
                    {user.fcmTokens.length > 0 && (
                      <div className="text-gray-900">
                        Google: <span className="font-medium">{user.fcmTokens.length}</span>
                      </div>
                    )}
                    {user.apnsTokens.length === 0 && user.fcmTokens.length === 0 && (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <Link
                    to={`/users/${user.id}/subscriptions`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Subscriptions
                  </Link>
                  <button
                    onClick={() => handleDelete(user.id, user.email)}
                    className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => createMutation.mutateAsync(data)}
      />
    </div>
  );
}
