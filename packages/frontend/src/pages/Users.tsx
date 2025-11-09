import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/users';
import { Link } from 'react-router-dom';
import { Plus, Mail, Phone, Globe } from 'lucide-react';

export function Users() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.list(),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.id.slice(0, 8)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {user.apnsDeviceToken && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        iOS
                      </span>
                    )}
                    {user.fcmDeviceToken && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        Android
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    to={`/users/${user.id}/subscriptions`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Subscriptions
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.users.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
        </div>
      )}
    </div>
  );
}
