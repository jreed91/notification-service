import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { CreateUserRequest } from '@notification-service/shared';

// T041: Form validation with React Hook Form + Zod
const userSchema = z.object({
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phoneNumber: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g., +14155552671)')
    .optional()
    .or(z.literal('')),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/, 'Locale must be in format: en-US, es-ES, etc.').default('en-US'),
  timezone: z.string().optional(),
  apnsTokens: z.string().optional(),
  fcmTokens: z.string().optional(),
}).refine(
  (data) => {
    // At least one contact method required
    return data.email || data.phoneNumber || data.apnsTokens || data.fcmTokens;
  },
  {
    message: 'At least one contact method (email, phone, or device token) is required',
    path: ['email'], // Show error on email field
  }
);

type UserFormData = z.infer<typeof userSchema>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
}

export function CreateUserModal({ isOpen, onClose, onSubmit }: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      locale: 'en-US',
      email: '',
      phoneNumber: '',
      timezone: '',
      apnsTokens: '',
      fcmTokens: '',
    },
  });

  const onFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      // Transform form data to API request
      const payload: CreateUserRequest = {
        email: data.email || undefined,
        phoneNumber: data.phoneNumber || undefined,
        locale: data.locale,
        timezone: data.timezone || undefined,
        apnsTokens: data.apnsTokens
          ? data.apnsTokens.split(',').map(t => t.trim()).filter(Boolean)
          : undefined,
        fcmTokens: data.fcmTokens
          ? data.fcmTokens.split(',').map(t => t.trim()).filter(Boolean)
          : undefined,
      };

      await onSubmit(payload);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create user:', error);
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
          <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              {...register('phoneNumber')}
              type="text"
              id="phoneNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+14155552671"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Format: E.164 international format (e.g., +14155552671)
            </p>
          </div>

          {/* Locale */}
          <div>
            <label htmlFor="locale" className="block text-sm font-medium text-gray-700 mb-1">
              Locale *
            </label>
            <input
              {...register('locale')}
              type="text"
              id="locale"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="en-US"
            />
            {errors.locale && (
              <p className="mt-1 text-sm text-red-600">{errors.locale.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Format: language-COUNTRY (e.g., en-US, es-ES, fr-FR)
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <input
              {...register('timezone')}
              type="text"
              id="timezone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="America/Los_Angeles"
            />
            {errors.timezone && (
              <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Format: IANA timezone (e.g., America/New_York, Europe/London)
            </p>
          </div>

          {/* APNs Device Tokens */}
          <div>
            <label htmlFor="apnsTokens" className="block text-sm font-medium text-gray-700 mb-1">
              Apple Push Tokens
            </label>
            <input
              {...register('apnsTokens')}
              type="text"
              id="apnsTokens"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="token1, token2, token3"
            />
            {errors.apnsTokens && (
              <p className="mt-1 text-sm text-red-600">{errors.apnsTokens.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Comma-separated list of APNs device tokens for iOS/macOS devices
            </p>
          </div>

          {/* FCM Device Tokens */}
          <div>
            <label htmlFor="fcmTokens" className="block text-sm font-medium text-gray-700 mb-1">
              Google Push Tokens
            </label>
            <input
              {...register('fcmTokens')}
              type="text"
              id="fcmTokens"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="token1, token2, token3"
            />
            {errors.fcmTokens && (
              <p className="mt-1 text-sm text-red-600">{errors.fcmTokens.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Comma-separated list of FCM device tokens for Android devices
            </p>
          </div>

          {/* Note about contact method requirement */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> At least one contact method (email, phone, or device token) must be provided.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
