# Frontend Environment Variables Setup

## Overview

The frontend reads environment variables from the **root `.env` file** (not from `frontend/.env`). This is configured in `vite.config.ts` using the `envDir` option.

## How It Works

1. **Environment Variables Location**: All environment variables (including `VITE_*` prefixed ones) are stored in the root `.env` file at `/root/hackathon-mongodb/.env`

2. **Vite Configuration**: The `frontend/vite.config.ts` is configured to:
   - Look for `.env` files in the parent directory (project root) via `envDir: path.resolve(__dirname, "..")`
   - Only load variables prefixed with `VITE_` via `envPrefix: "VITE_"`

3. **Build Script**: The `build-frontend.sh` script:
   - Automatically loads `VITE_*` variables from the root `.env` file
   - Exports them as environment variables before running the build
   - This ensures they're available during the build process

## Required Environment Variables

The frontend needs these `VITE_*` prefixed variables in the root `.env` file:

```env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here  # Optional, falls back to VITE_GOOGLE_API_KEY
```

## Building the Frontend

To build the frontend with environment variables from the root `.env`:

```bash
./build-frontend.sh
```

Or manually:

```bash
cd frontend
# The build script exports VITE_ vars from root .env automatically
npm run build
```

## How Variables Are Embedded

During the build process:
1. Vite reads the `.env` file from the project root (configured via `envDir`)
2. It filters for variables prefixed with `VITE_`
3. These variables are embedded into the build bundle at build time
4. They're accessible in the frontend code via `import.meta.env.VITE_*`

## Important Notes

- Environment variables must be in the **root `.env` file**, not in `frontend/.env`
- Only variables prefixed with `VITE_` are exposed to the frontend (for security)
- Variables are embedded at **build time**, not runtime
- If you change `.env` values, you must rebuild the frontend for changes to take effect
- The `frontend/.env.local` file (if it exists) will be ignored since `envDir` points to the parent directory

## Troubleshooting

If environment variables aren't working:

1. Check that variables are in the root `.env` file (not `frontend/.env`)
2. Verify variables are prefixed with `VITE_`
3. Rebuild the frontend after changing `.env` values
4. Check the build output for any warnings about missing variables
5. Verify `vite.config.ts` has `envDir: path.resolve(__dirname, "..")`
