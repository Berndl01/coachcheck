import Link from 'next/link';
import { HumatrixLogo } from '@/components/logo';
import { getT } from '@/lib/i18n/server';

export async function Footer() {
  const t = await getT();
  return (
    <footer className="bg-ink text-muted-dark pt-16 pb-8 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_2fr] gap-12 md:gap-16">
        <div>
          <HumatrixLogo size={40} variant="inverted" />
          <p className="font-editorial text-base leading-[1.45] text-bone-soft mt-6 max-w-[38ch]">
            {t('footer.tagline')}<br />
            {t('footer.taglineSub')}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div>
            <h5 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold font-medium mb-4">
              {t('footer.colSport')}
            </h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#products" className="text-bone-soft hover:text-gold transition">{t('footer.lAllPackages')}</Link></li>
              <li><Link href="/#architecture" className="text-bone-soft hover:text-gold transition">{t('footer.lArchitecture')}</Link></li>
              <li><Link href="/#archetypes" className="text-bone-soft hover:text-gold transition">{t('footer.lArchetypes')}</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold font-medium mb-4">
              {t('footer.colCompany')}
            </h5>
            <ul className="space-y-2 text-sm">
              <li><a href="https://check.humatrix.cc" className="text-bone-soft hover:text-gold transition">{t('footer.lMindsetCheck')}</a></li>
              <li><a href="#" className="text-bone-soft hover:text-gold transition">{t('footer.lLeadership')}</a></li>
              <li><a href="#" className="text-bone-soft hover:text-gold transition">{t('footer.lAbout')}</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-gold font-medium mb-4">
              {t('footer.colLegal')}
            </h5>
            <ul className="space-y-2 text-sm">
              <li><a href="/legal/impressum" className="text-bone-soft hover:text-gold transition">{t('footer.lImprint')}</a></li>
              <li><a href="/legal/datenschutz" className="text-bone-soft hover:text-gold transition">{t('footer.lPrivacy')}</a></li>
              <li><a href="/legal/agb" className="text-bone-soft hover:text-gold transition">{t('footer.lTerms')}</a></li>
              <li><a href="/widerruf" className="text-bone-soft hover:text-gold transition">{t('footer.lWithdraw')}</a></li>
              <li><a href="/kontakt" className="text-bone-soft hover:text-gold transition">{t('footer.lContact')}</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-ink-line">
        <div className="mb-6">
          <p className="font-editorial italic text-base text-bone-soft leading-[1.5] max-w-[60ch]">
            {t('footer.blurb')}
          </p>
        </div>
        <div className="flex flex-wrap justify-between gap-4 font-mono text-[0.68rem] uppercase tracking-[0.12em]">
          <span>{t('footer.copyright')}</span>
          <span>{t('footer.made')}</span>
        </div>
      </div>
    </footer>
  );
}
