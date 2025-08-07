# PrintEasy QR - Print Management Platform

## Quick Start

**Development:**
```bash
node server/start-unified.cjs
```
Access at: http://localhost:5000

**Production:**
```bash
NODE_ENV=production node server/start-unified.cjs
```

## Testing

Run comprehensive endpoint tests:
```bash
node test-endpoints.cjs
```

## Architecture

- **Server:** Pure CommonJS architecture (`server/app-unified.cjs`)
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** JWT-based
- **Design:** Golden yellow (#FFBF00) and black theme

## Core Features

- QR code generation for shops
- Customer and shop owner authentication
- Order management system
- File upload support
- Real-time chat capabilities
- Admin dashboard

## API Endpoints

- `GET /api/health` - Server status
- `POST /api/generate-qr` - Generate QR codes
- `POST /api/auth/customer/login` - Customer authentication
- `POST /api/auth/shop-owner/login` - Shop owner authentication
- `GET /api/shops` - List shops
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order

## Deployment

### Netlify
- Build command: `cp server/app-unified.cjs netlify/functions/server.js`
- Publish directory: `client`
- Functions directory: `netlify/functions`

### Environment Variables
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## Project Structure

```
server/
  ├── app-unified.cjs      # Main Express application
  └── start-unified.cjs     # Startup script
client/                     # Frontend files
netlify/                    # Deployment configuration
test-endpoints.cjs          # API testing suite
```

## License

MIT