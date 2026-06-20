# FIX v3_59 — i18n Welle 3a: Käufer-Reise zweisprachig

## Was
Erster Teil der App-Seiten hinter dem Login: globales Chrome + Einstieg + Transaktion +
Konto sind jetzt DE/EN. Ein englischer Käufer kann sich registrieren, einloggen, Passwort
zurücksetzen, auschecken und sein Konto verwalten — vollständig auf Englisch.

## Umgestellt (14 Dateien)
- Chrome: cookie-banner (Client; war im Root-Layout noch deutsch -> Landing-Lücke geschlossen),
  error.tsx (Client), not-found.tsx (jetzt async Server).
- Auth: login, signup, passwort-vergessen, passwort-neu (Client; Fehlermeldungen in
  Handlern/Effects ebenfalls auf t()).
- Checkout: checkout/[slug] (Server; sprachabhängige Währung de-DE/en-IE), consent-form
  (Client), checkout/success (Server).
- Konto: konto/daten + data-controls (Client), profil/setup + setup-form (Client).

## Wörterbuch
16 neue Sektionen (cookieBanner, errorPage, notFound, auth, login, options, signup,
passwordForgot, passwordReset, checkout, checkoutSuccess, consent, kontoData, dataControls,
profileSetupPage, profileSetup). DE/EN strukturgleich (Dictionary-Typ erzwingt es).

## Festlegungen / Flags
- DB-Auswahlwerte (sport=fussball, role=trainer, training_level=leistungszentrum …) bleiben;
  nur sichtbare Labels übersetzt.
- FLAG (Anwalt): consent-form = rechtlich operativer Text (FAGG-Widerrufsverzicht, DSGVO).
  Deutsch ist operativ; Englisch ist Verständnis-Entwurf, anwaltlich freizugeben vor EN-Markt.
- FLAG (DB): Checkout zeigt name_de/description aus DB (Deutsch). Echte EN-Texte = spätere
  Spalten name_en/description_en.
- Korrektur: Consent-Hinweis "alle drei Punkte" -> "vier" (es sind vier Checkboxen).

## Verifikation
- Residual-Deutsch-Scan der 14 Dateien: sauber (Code-Kommentare bewusst deutsch).
- Gates: tsc OK · claimcheck 65 · vitest 355/355 (34) · eslint OK · next build Exit 0
  · npm audit 0 · PDF 4/4.

## Verbleibend (Welle 3)
3b Dashboard + Assessment-Erlebnis · 3c Token-Flows · 3d Content-Seiten. Admin + Rechtsseiten
bewusst ausgeschlossen. Siehe I18N.md.
