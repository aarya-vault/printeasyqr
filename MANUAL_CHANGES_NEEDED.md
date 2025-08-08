# Manual Changes Required for Deployment Fix

## 1. Environment Variables in Netlify Dashboard

Go to your Netlify site settings > Environment variables and add:

```
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret_key
```

## 2. Package.json Dependencies Fix

The build is failing because Vite and build tools are in devDependencies. Move these to dependencies:

**From devDependencies to dependencies:**
- `vite`
- `@vitejs/plugin-react`
- `typescript`
- `tailwindcss`
- `autoprefixer`
- `postcss`
- `@hookform/resolvers`
- `@tanstack/react-query`
- `class-variance-authority`
- `clsx`
- `lucide-react`
- `react`
- `react-dom`
- `react-hook-form`
- `tailwind-merge`
- `tailwindcss-animate`
- `tsx`
- `wouter`

**Keep in devDependencies:**
- All `@types/*` packages
- Type definitions only

## 3. Build Command Update (Optional)

If the above doesn't work, change the build command in netlify.toml to:
```toml
[build]
  command = "npm ci --production=false && npm run build"
```

## 4. Database Setup

Ensure your PostgreSQL database:
- Allows external connections
- Has correct connection string format
- SSL is properly configured for production

## Priority Order:
1. Fix environment variables first
2. Update package.json dependencies
3. Test build locally with `npm run build`
4. Deploy to Netlify