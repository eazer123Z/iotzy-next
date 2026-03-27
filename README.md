# IoTzy (React + PHP Native)

Project ini sudah dimigrasikan menjadi **bukan Next.js lagi**.

## Struktur folder (rapi)

- `apps/web/` → React + Vite (frontend)
- `apps/api/` → PHP native + PDO (backend API)
- `schema.sql` → skema database MySQL

## Jalankan cepat

### 1) Siapkan database

```bash
# import schema.sql ke MySQL kamu
```

### 2) API (PHP)

```bash
cp apps/api/.env.example apps/api/.env
npm run api:dev
```

### 3) Frontend (React)

```bash
cp apps/web/.env.example apps/web/.env
npm --prefix apps/web install
npm run dev
```

## Build frontend

```bash
npm run build
```


## Dokumen arsitektur

- `docs/ARCHITECTURE.md`
