# Paris Startup Arena 🗼

An interactive map showcasing job opportunities at Paris-based startups. Explore roles across DeepTech, FinTech, HealthTech, and more with real-time data from Welcome to the Jungle and ATS scrapers.

## ✨ Features

- **Interactive Map** - Mapbox GL map with job pins across Paris arrondissements
- **Live Job Data** - Automated daily sync from Welcome to the Jungle and ATS scrapers
- **Smart Filtering** - Filter by category, sector, work mode, and location
- **Company Profiles** - Detailed company info with funding stage and team size
- **Responsive Design** - Split-screen layout with map and scrollable job cards
- **Smooth Animations** - Framer Motion animations throughout

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Supabase account (free tier)
- Mapbox account (free tier)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `VITE_MAPBOX_ACCESS_TOKEN` - Your Mapbox access token
- `CRON_SECRET` - Random string for API protection

### 3. Set Up Database
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the schema migration in Supabase SQL Editor:
   ```bash
   # Copy contents of supabase/schema.sql and paste in SQL Editor
   ```
3. Seed initial data:
   ```bash
   npm run seed
   ```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard
4. Deploy!

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

### GitHub Actions Setup

The project includes automated daily job sync via GitHub Actions:

1. Add secrets to your GitHub repository:
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. The workflow runs daily at 06:00 Paris time
3. Manually trigger from Actions tab if needed

## 📚 Documentation

- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Complete backend setup guide
- **[ATS_SCRAPERS.md](./ATS_SCRAPERS.md)** - ATS scraper documentation and usage
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Vercel deployment guide
- **[supabase/schema.sql](./supabase/schema.sql)** - Database schema

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Framer Motion
- Mapbox GL
- Tailwind CSS

**Backend:**
- Express.js (serverless on Vercel)
- Supabase (PostgreSQL)
- GitHub Actions (cron jobs)

**Data Pipeline:**
- Welcome to the Jungle API
- Nominatim geocoding (OpenStreetMap)

## 📊 API Endpoints

- `GET /api/companies` - All active companies with job counts
- `GET /api/jobs` - All jobs with filtering and pagination
- `POST /api/waitlist` - Add email to waitlist
- `GET /api/stats` - Summary statistics

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Database
npm run seed             # Seed initial companies
npm run sync             # Run job sync manually

# Deployment
vercel                   # Deploy to Vercel
vercel --prod            # Deploy to production
```

## 🌍 Environment

**Free Tier Costs:**
- Supabase: $0/month (500 MB database, 2 GB bandwidth)
- Vercel: $0/month (100 GB bandwidth, unlimited API requests)
- GitHub Actions: $0/month (2,000 minutes/month)
- **Total: $0/month** ✅

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For issues or questions, check the documentation or open a GitHub issue.
