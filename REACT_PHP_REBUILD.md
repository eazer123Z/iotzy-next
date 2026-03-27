# Rebuild: React + PHP Native

Sesuai permintaan, baseline baru disiapkan dengan stack:

- `frontend-react/` → React + Vite
- `backend-php/` → PHP native (router sederhana) + PDO MySQL

## Quick start

### 1) Backend

```bash
cd backend-php
cp .env.example .env
php -S 0.0.0.0:8080 -t public
```

### 2) Frontend

```bash
cd frontend-react
npm install
cp .env.example .env
npm run dev
```

Frontend akan call API backend di `VITE_API_BASE`.

## Endpoint minimal

- `GET /api/health`
- `GET /api/dashboard?userId=1`

## Catatan

Implementasi ini adalah pondasi total rombak ke React + PHP native yang ringan dan cepat, agar iterasi berikutnya tinggal migrasi fitur per halaman.
