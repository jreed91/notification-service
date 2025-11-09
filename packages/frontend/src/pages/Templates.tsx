import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi } from '../api/templates';
import { Plus, Trash2, Edit, FileText } from 'lucide-react';
import { DeliveryChannel } from '@notification-service/shared';

export function Templates() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => templateApi.delete(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Notification Templates</h1>
        <button
          onClick={() => alert('Create template modal coming soon')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create Template</span>
        </button>
      </div>

      <div className="grid gap-6">
        {data?.templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{template.key}</code>
                </div>
                {template.description && (
                  <p className="mt-2 text-gray-600">{template.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(template.channels as DeliveryChannel[]).map((channel) => (
                    <span
                      key={channel}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {channel}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Available Locales:</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Object.keys(template.translations).map((locale) => (
                      <span
                        key={locale}
                        className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700"
                      >
                        {locale}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-600 hover:text-blue-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(template.key)}
                  className="p-2 text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new template.</p>
        </div>
      )}
    </div>
  );
}
