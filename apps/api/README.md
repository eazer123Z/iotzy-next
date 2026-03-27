# Backend PHP Native

API ringan berbasis PHP native (tanpa framework), terhubung ke skema MySQL IoTzy.

## Jalankan

```bash
cp .env.example .env
php -S 0.0.0.0:8080 -t public
```

## Endpoint

- `GET /api/health`
- `GET /api/menu`
- `GET /api/dashboard?userId=1`
- `GET /api/devices?userId=1`
- `GET /api/sensors?userId=1`
- `GET /api/automation?userId=1`
- `GET /api/settings?userId=1`
- `GET /api/bootstrap?userId=1`

## Skema database

Gunakan `../../schema.sql` untuk membuat tabel yang dipakai endpoint di atas.
