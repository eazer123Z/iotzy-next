# IoTzy (React + PHP Native)

Project ini sudah dimigrasikan menjadi **bukan Next.js lagi**.

## Struktur

- `frontend-react/` → React + Vite
- `backend-php/` → PHP native (PDO + MySQL)
- `schema.sql` → skema database MySQL

## Jalankan cepat

### 1) Siapkan database

```bash
# import schema.sql ke MySQL kamu
```

### 2) API (PHP)

```bash
cp backend-php/.env.example backend-php/.env
npm run api:dev
```

### 3) Frontend (React)

```bash
cp frontend-react/.env.example frontend-react/.env
npm --prefix frontend-react install
npm run dev
```

## Build frontend

```bash
npm run build
```
