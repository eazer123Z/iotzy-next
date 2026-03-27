# Rebuild: React + PHP Native

Sesuai permintaan, struktur project sekarang disusun lebih clean:

- `apps/web/` → React + Vite
- `apps/api/` → PHP native (router sederhana) + PDO MySQL

## Quick start

### 1) Backend API

```bash
cd apps/api
cp .env.example .env
php -S 0.0.0.0:8080 -t public
```

### 2) Frontend Web

```bash
cd apps/web
npm install
cp .env.example .env
npm run dev
```

Frontend akan call API backend di `VITE_API_BASE`.

## Endpoint utama

- `GET /api/health`
- `GET /api/menu`
- `GET /api/dashboard?userId=1`
- `GET /api/devices?userId=1`
- `GET /api/sensors?userId=1`
- `GET /api/automation?userId=1`
- `GET /api/settings?userId=1`
- `GET /api/bootstrap?userId=1`
