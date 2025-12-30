# Cross Stitch-up

A collection of free tools to help you work with cross stitch patterns. Built with Next.js 16 and designed for performance and reliability.

## Features

### Pattern Merge

Combine multi-page cross stitch pattern PDFs (like those from StitchBox) into a single unified image. Perfect for patterns that are split across multiple pages (e.g., 4 quadrants).

- Upload PDF patterns via drag-and-drop
- Automatically detect and extract grid sections
- Merge pages into one complete pattern
- Export as high-resolution PNG or PDF
- Zoomable preview of merged results

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI)
- **Authentication**: Better Auth with Google OAuth
- **Database**: PostgreSQL
- **Email**: Resend
- **PDF Processing**: pdfjs-dist
- **Monitoring**: Sentry
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm
- PostgreSQL database

### Installation

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd pdf-cross-stitch-stitcher
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Set up environment variables (see [Environment Variables](#environment-variables))

4. Start the development server:

    ```bash
    pnpm dev
    ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

| Variable                       | Description                                          | Required |
| ------------------------------ | ---------------------------------------------------- | -------- |
| `BETTER_AUTH_SECRET`           | Secret key for Better Auth session encryption        | Yes      |
| `BETTER_AUTH_URL`              | Base URL of your app (e.g., `http://localhost:3000`) | Yes      |
| `GOOGLE_CLIENT_ID`             | Google OAuth client ID                               | Yes      |
| `GOOGLE_CLIENT_SECRET`         | Google OAuth client secret                           | Yes      |
| `POSTGRES_URL`                 | PostgreSQL connection string                         | Yes      |
| `RESEND_API_KEY`               | API key for Resend email service                     | Yes      |
| `SENTRY_AUTH_TOKEN`            | Sentry authentication token for error tracking       | No       |
| `BLOB_READ_WRITE_TOKEN`        | Vercel Blob storage token                            | No       |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Set to `0` for local dev with self-signed certs      | No       |

### Example `.env.local`

```bash
# Authentication
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/crossstitchup

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional
SENTRY_AUTH_TOKEN=your-sentry-token
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Setting Up Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
    - `http://localhost:3000/api/auth/callback/google` (development)
    - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret to your environment variables

### Syncing Environment Variables from Vercel

If you have the project deployed on Vercel, you can sync environment variables:

```bash
pnpm sync-env
```

## Available Scripts

| Command             | Description                                                                   |
| ------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`          | Start development server                                                      |
| `pnpm build`        | Create production build                                                       |
| `pnpm start`        | Start production server                                                       |
| `pnpm lint`         | Run ESLint                                                                    |
| `pnpm lint:fix`     | Run ESLint with auto-fix                                                      |
| `pnpm format`       | Format code with Prettier                                                     |
| `pnpm format:check` | Check formatting without changes                                              |
| `pnpm e2e-test`     | Run Playwright end-to-end tests                                               |
| `pnpm sync-env`     | Pull environment variables from Vercel. Make sure you run `vercel link` first |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables in Project Settings > Environment Variables
4. Deploy

### Environment Variables on Vercel

Add the following environment variables in your Vercel project settings:

- `BETTER_AUTH_SECRET` - Generate a secure random string
- `BETTER_AUTH_URL` - Your production URL (e.g., `https://crossstitchup.com`)
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `POSTGRES_URL` - Your PostgreSQL connection string (Vercel Postgres or external)
- `RESEND_API_KEY` - Your Resend API key
- `SENTRY_AUTH_TOKEN` - Your Sentry auth token (optional)
- `BLOB_READ_WRITE_TOKEN` - Auto-generated if using Vercel Blob

## Your Data

Cross Stitch-up handles your pattern data responsibly:

- **Authenticated accounts**: Your data is protected through secure authentication
- **No data selling**: We never sell or share your pattern data with third parties
- **Performance-focused**: Processing is optimized for speed and reliability

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run linting and formatting before committing:
    ```bash
    pnpm lint:fix && pnpm format
    ```
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is private and proprietary.
