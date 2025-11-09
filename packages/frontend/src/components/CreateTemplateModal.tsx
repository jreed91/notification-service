import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { DeliveryChannel } from '@notification-service/shared';

const templateSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[a-z0-9-_]+$/, 'Key must contain only lowercase letters, numbers, hyphens, and underscores'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  channels: z.array(z.nativeEnum(DeliveryChannel)).min(1, 'At least one channel is required'),
  locale: z.string().default('en-US'),
  subject: z.string().optional(),
  title: z.string().optional(),
  body: z.string().min(1, 'Body is required'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function CreateTemplateModal({ isOpen, onClose, onSubmit }: CreateTemplateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      channels: [],
      locale: 'en-US',
    },
  });

  const selectedChannels = watch('channels');

  const onFormSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      // Transform the data to match the API format
      const payload = {
        key: data.key,
        name: data.name,
        description: data.description || undefined,
        channels: data.channels,
        translations: {
          [data.locale]: {
            subject: data.subject || undefined,
            title: data.title || undefined,
            body: data.body,
          },
        },
      };

      await onSubmit(payload);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create New Template</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Key */}
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
              Template Key *
            </label>
            <input
              {...register('key')}
              type="text"
              id="key"
              placeholder="welcome-email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.key && (
              <p className="mt-1 text-sm text-red-600">{errors.key.message}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              placeholder="Welcome Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={2}
              placeholder="A brief description of when this template is used"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Channels *
            </label>
            <div className="space-y-2">
              {Object.values(DeliveryChannel).map((channel) => (
                <label key={channel} className="flex items-center">
                  <input
                    {...register('channels')}
                    type="checkbox"
                    value={channel}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{channel}</span>
                </label>
              ))}
            </div>
            {errors.channels && (
              <p className="mt-1 text-sm text-red-600">{errors.channels.message}</p>
            )}
          </div>

          {/* Locale */}
          <div>
            <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-1">
              Locale
            </label>
            <input
              {...register('locale')}
              type="text"
              id="locale"
              placeholder="en-US"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject (conditional) */}
          {(selectedChannels?.includes(DeliveryChannel.EMAIL) ||
            selectedChannels?.includes(DeliveryChannel.APPLE_PUSH) ||
            selectedChannels?.includes(DeliveryChannel.GOOGLE_PUSH)) && (
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject {selectedChannels?.includes(DeliveryChannel.EMAIL) && '*'}
              </label>
              <input
                {...register('subject')}
                type="text"
                id="subject"
                placeholder="Welcome to our app!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>
          )}

          {/* Title (conditional) */}
          {(selectedChannels?.includes(DeliveryChannel.APPLE_PUSH) ||
            selectedChannels?.includes(DeliveryChannel.GOOGLE_PUSH)) && (
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                {...register('title')}
                type="text"
                id="title"
                placeholder="Welcome!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
              Message Body *
            </label>
            <textarea
              {...register('body')}
              id="body"
              rows={6}
              placeholder="Hi {{name}}, welcome to our app! We're excited to have you here."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Use Handlebars syntax for variables: {`{{variableName}}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
