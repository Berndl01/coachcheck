import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { de } from '@/lib/i18n/dictionaries/de';
import { en } from '@/lib/i18n/dictionaries/en';

const ROOT = process.cwd();
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

describe('Trainer-Profil · /profil', () => {
  const src = read('app/profil/page.tsx');

  it('Profil-Seite existiert und ist dynamisch', () => {
    expect(src).toMatch(/export default async function ProfilePage/);
    expect(src).toMatch(/force-dynamic/);
  });

  it('zeigt Käufe, Fortschritt, Stammdaten und 360°', () => {
    expect(src).toMatch(/from\('purchases'\)/);
    expect(src).toMatch(/from\('assessments'\)/);
    expect(src).toMatch(/from\('action_plans'\)/);
    expect(src).toMatch(/from\('invitations'\)/);
    expect(src).toMatch(/invitation_type.*fremdbild|'fremdbild'/);
  });

  it('verlinkt 360°-Verwaltung in die jeweilige Auswertung', () => {
    expect(src).toMatch(/\/assessment\/\$\{a\.id\}\/result/);
    expect(src).toMatch(/threeSixtyManage/);
  });

  it('nutzt RLS-Server-Client (kein admin) für eigene Daten', () => {
    expect(src).toMatch(/createClient/);
    expect(src).not.toMatch(/createAdminClient/);
  });

  it('TopNav verlinkt das Profil für eingeloggte Nutzer', () => {
    const nav = read('components/top-nav.tsx');
    expect(nav).toMatch(/href="\/profil"/);
    expect(nav).toMatch(/nav\.profile/);
  });

  it('i18n: profile-Namespace in DE und EN vorhanden (Parität)', () => {
    expect((de as { profile?: unknown }).profile).toBeTruthy();
    expect((en as { profile?: unknown }).profile).toBeTruthy();
    expect(de.profile.purchases.length).toBeGreaterThan(0);
    expect(en.profile.purchases.length).toBeGreaterThan(0);
    expect(de.nav.profile.length).toBeGreaterThan(0);
    expect(en.nav.profile.length).toBeGreaterThan(0);
  });
});
