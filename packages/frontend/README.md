# Notification Service Frontend

React-based dashboard for managing notification templates, users, and viewing notification history.

## Features

- Modern React with TypeScript
- Vite for fast development and building
- TailwindCSS for styling
- React Router for navigation
- TanStack Query for server state management
- Zustand for client state
- API key-based authentication

## Project Structure

```
src/
├── api/              # API client and endpoints
├── components/       # Reusable React components
├── pages/           # Page components
├── stores/          # Zustand stores
├── utils/           # Utility functions
├── App.tsx          # Main application component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## Pages

- **Dashboard** - Overview and quick links
- **Templates** - Manage notification templates
- **Users** - Manage users and their contact information
- **Subscriptions** - Manage user notification preferences
- **Notifications** - View notification history
- **Send Notification** - Send test notifications

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

If not set, the frontend will use `/api` as the base URL (using Vite's proxy in development).

## Authentication

The frontend uses API key authentication stored in localStorage. Enter your API key on the login page to access the dashboard.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory and can be served by any static file server or CDN.

## Deployment

### Static Hosting (Netlify, Vercel, etc.)

1. Build the project: `npm run build`
2. Deploy the `dist/` folder
3. Configure environment variables (VITE_API_URL)
4. Set up redirects for client-side routing:

**Netlify** (`_redirects`):
```
/*  /index.html  200
```

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Customization

### Styling

The application uses TailwindCSS. Customize the theme in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    },
  },
}
```

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Add navigation link in `src/components/Layout.tsx`
