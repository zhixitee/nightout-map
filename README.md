# 🌙 NightOut Maps

A collaborative event planning and nightlife discovery platform built with Next.js, featuring interactive Google Maps integration, route optimization, and seamless event management.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19.2-61dafb)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e)

## ✨ Features

### 🗺️ Interactive Map Experience
- **Real-time Location Tracking**: Automatically detects and centers on your current location
- **Interactive Markers**: Drag and drop markers to explore different locations
- **Search Radius Control**: Customize search area with adjustable radius
- **Traffic Overlay**: Toggle real-time traffic information
- **Dark/Light Mode**: Adaptive map color schemes based on theme preference
- **Place Details**: View comprehensive information including ratings, photos, hours, and price levels

### 🎉 Event Management
- **Create Events**: Plan night outs with detailed information (title, date, location, description)
- **Multi-Stop Itineraries**: Add multiple venues to create a complete night out route
- **Automatic Route Optimization**: AI-powered route planning for the most efficient journey
- **Participant Management**: Set max capacity and track current participants
- **Invite System**: Email invitations via SendGrid with shareable links
- **Invite Link Expiry**: Time-limited invite links for security
- **Event Cancellation**: Cancel events with automatic email notifications to all invitees

### 🔍 Venue Discovery
- **Places Search**: Find nearby bars, restaurants, cafes, and more
- **Type Filtering**: Filter by specific place types (restaurants, bars, cafes, etc.)
- **Detailed Information**: View ratings, addresses, and other venue details
- **Route Preview**: Visualize multi-stop routes on an interactive map
- **Add to Route**: Build custom itineraries by adding venues to your event

### 👤 User Features
- **Authentication**: Email/password and Google OAuth support via Supabase
- **User Profiles**: Manage account information and preferences
- **Personalization**: Save and manage personal preferences
- **Secure Sessions**: Session-based authentication with automatic token refresh

### 🎨 UI/UX
- **Constellation Background**: Animated starfield background effect
- **Responsive Design**: Mobile-friendly interface
- **Smooth Animations**: Polished transitions and interactions
- **Accessibility**: ARIA labels and keyboard navigation support

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19.2** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **CSS Modules** - Component-scoped styling

### Backend & Services
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication (Email/Password, OAuth)
  - Row Level Security (RLS)
  - Real-time subscriptions
- **Google Maps API** - Maps, Places, Geocoding, Directions
- **SendGrid** - Email delivery service

### Key Libraries
- `@react-google-maps/api` - Google Maps React components
- `@supabase/supabase-js` - Supabase client
- `@sendgrid/mail` - Email sending

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **pnpm**
- **Supabase Account** - [Sign up here](https://supabase.com)
- **Google Maps API Key** - [Get one here](https://developers.google.com/maps/documentation/javascript/get-api-key)
- **SendGrid API Key** - [Sign up here](https://sendgrid.com)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/zhixitee/nightout-map.git
cd nightout-map
```

### 2. Install Dependencies

```bash
cd sas-maps-app
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the `sas-maps-app` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email
```

#### Getting Your API Keys

**Supabase:**
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy the Project URL and anon public key
4. Copy the service_role key (keep this secret!)

**Google Maps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
4. Create credentials (API Key)
5. Restrict the key to your domain in production

**SendGrid:**
1. Sign up at [SendGrid](https://sendgrid.com)
2. Verify your sender email address
3. Create an API key with "Mail Send" permissions

### 4. Database Setup

Run the Supabase migrations to set up your database:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your_project_ref

# Run migrations
supabase db push
```

Or manually run the SQL files in `supabase/migrations/` in your Supabase SQL editor:
1. `20251026000000_create_events_tables.sql`
2. `20251026001000_add_invite_code_to_events.sql`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
sas-maps-app/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   └── events/
│   │   │       ├── [eventId]/
│   │   │       │   └── cancel/     # Cancel event endpoint
│   │   │       └── send-invites/   # Send invitations endpoint
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── callback/           # OAuth callback
│   │   │   ├── login/              # Login page
│   │   │   └── signup/             # Signup page
│   │   ├── components/             # React components
│   │   │   ├── EventsSidebar/      # Event management sidebar
│   │   │   ├── MapComponent.tsx    # Main map component
│   │   │   ├── PlacesComponent.tsx # Places search
│   │   │   ├── Navigation.tsx      # Top navigation bar
│   │   │   └── ...                 # Other components
│   │   ├── events/                 # Event pages
│   │   │   └── join/[id]/          # Join event via invite
│   │   ├── profile/                # User profile
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   └── globals.css             # Global styles
│   └── lib/
│       ├── AuthContext.tsx         # Authentication context
│       ├── MapSearchContext.tsx    # Map search state
│       ├── RoutePlannerContext.tsx # Route planning state
│       ├── ThemeContext.tsx        # Theme management
│       ├── supabaseClient.tsx      # Supabase client
│       └── useGoogleMapsLoader.ts  # Google Maps loader hook
├── supabase/
│   └── migrations/                 # Database migrations
├── next.config.ts                  # Next.js configuration
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript configuration
```

## 🗄️ Database Schema

### Tables

#### `profiles`
- User profile information
- Links to Supabase auth users
- Stores email and timestamps

#### `events`
- Event details (title, date, location, description)
- Host information
- Participant tracking (current/max)
- Invite links and expiry
- Unique invite codes

#### `event_invites`
- Invitation records
- Email addresses
- Status tracking (pending/accepted/declined)
- Prevents duplicate invites

#### `user_preferences` (if implemented)
- User preference storage
- Personalization settings

### Security

All tables use Row Level Security (RLS):
- Users can only create/update/delete their own events
- Invites are scoped to event hosts
- Profiles are publicly readable but only updatable by owners

## 🔑 Key Features Explained

### Route Optimization

The app uses Google Maps Directions API to:
1. Calculate optimal routes between multiple venues
2. Reorder waypoints for efficiency
3. Display estimated travel times
4. Visualize routes on the map

### Email Invitations

SendGrid integration provides:
- Professional HTML email templates
- Delivery tracking
- Duplicate detection
- Batch sending with error handling
- Cancellation notifications

### Context Providers

The app uses React Context for state management:
- **AuthContext**: User authentication state
- **MapSearchContext**: Map center, radius, and type filters
- **RoutePlannerContext**: Selected venues and route
- **ThemeContext**: Dark/light mode preference

## 🎨 Customization

### Theme

Modify theme colors in `src/app/globals.css`:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  /* ... other variables */
}
```

### Map Styling

Adjust map options in `MapComponent.tsx`:

```typescript
const mapOptions = {
  gestureHandling: "auto",
  zoomControl: true,
  colorScheme: theme === "dark" ? ColorScheme.LIGHT : ColorScheme.DARK,
  // Add custom styles here
};
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Docker

**Important**: Update your:
- Supabase redirect URLs
- Google Maps API key restrictions
- SendGrid sender verification

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
```

### Testing

Add your testing framework of choice:
- Jest + React Testing Library
- Playwright for E2E
- Cypress for integration tests

## 🐛 Troubleshooting

### Google Maps not loading
- Check API key is valid and unrestricted (for dev)
- Ensure all required APIs are enabled
- Check browser console for errors

### Database connection issues
- Verify Supabase URL and keys
- Check RLS policies
- Ensure migrations are applied

### Email not sending
- Verify SendGrid API key
- Check sender email is verified
- Review SendGrid activity logs

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the terms specified in the LICENSE file.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Google Maps Platform](https://developers.google.com/maps) - Maps and location services
- [SendGrid](https://sendgrid.com/) - Email delivery
- [Vercel](https://vercel.com/) - Deployment platform

## 📧 Support

For support, please open an issue on GitHub or contact the maintainers.

---

Built with ❤️ by the NightOut team