import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSession } from '../lib/auth';
import { prisma } from '../lib/db';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

// Mocks
vi.mock('../lib/db', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Auth Service / Sliding Session Rotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Harus menolak (return null) apabila session tidak ada atau kadaluarsa', async () => {
    // Simulasi tidak ada cookie "iotzy_session"
    (cookies().get as any).mockReturnValue(undefined);
    
    const sess = await getSession();
    expect(sess).toBeNull();
  });

  it('Harus me-rotasi session token baru bila umur > 12 Jam (Anti Hijack)', async () => {
    // Anggap Token Lama (Valid)
    const oldToken = 'old-stolen-token-123';
    (cookies().get as any).mockReturnValue({ value: oldToken });

    // Simulasi session ini dibuat "13" jam yang lalu di Database
    const pastDate13h = new Date(Date.now() - 13 * 3600000); 
    const farFutureExpire = new Date(Date.now() + 86400000);

    const mockDbReturn = {
      id: 99,
      sessionToken: oldToken,
      createdAt: pastDate13h,
      expiresAt: farFutureExpire,
      user: { id: 1, username: 'tester', settings: { theme: 'dark'} }
    };
    
    (prisma.session.findUnique as any).mockResolvedValue(mockDbReturn);

    const sess = await getSession();

    // Verifikasi Token DB Di-update! (Session diputar/rotasi)
    expect(prisma.session.update).toHaveBeenCalled();
    expect(cookies().set).toHaveBeenCalled();
    
    // Verifikasi Auth Sukses Masuk
    expect(sess?.username).toBe('tester');
    expect(sess?.theme).toBe('dark');
  });

  it('TIDAK Boleh me-rotasi session jika umurnya masih muda (< 12 jam)', async () => {
    const activeToken = 'fresh-token';
    (cookies().get as any).mockReturnValue({ value: activeToken });

    // Simulasi session baru dibuat 1 jam lalu
    const pastDate1h = new Date(Date.now() - 1 * 3600000); 
    const mockDbReturn = {
      id: 99,
      sessionToken: activeToken,
      createdAt: pastDate1h,
      expiresAt: new Date(Date.now() + 86400000),
      user: { id: 1, username: 'tester', settings: { theme: 'dark'} }
    };
    
    (prisma.session.findUnique as any).mockResolvedValue(mockDbReturn);

    const sess = await getSession();

    // Verifikasi DB Session UPDATE TIDAK dipanggil (Menghemat resources DB)
    expect(prisma.session.update).not.toHaveBeenCalled();
    expect(cookies().set).not.toHaveBeenCalled();
  });
});
