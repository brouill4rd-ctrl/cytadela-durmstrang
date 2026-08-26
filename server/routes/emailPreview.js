import { Router } from 'express';
import { EMAIL_TYPES, HOUSE_EMAIL_THEMES } from '../email/emailTemplates.js';
import { renderEmailPreview } from '../email/transactionalEmailService.js';

const router = Router();

router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Podgląd wiadomości jest wyłączony w środowisku produkcyjnym.');
  }
  next();
});

router.get('/', (req, res) => {
  const links = [
    ['MAIL 1 — konto oczekujące', '/api/email-preview/account-created'],
    ...Object.values(HOUSE_EMAIL_THEMES).map(house => [
      `MAIL 2 — wariant ${house.name}`,
      `/api/email-preview/account-approved/${house.name.toLowerCase().replace('ö', 'o')}`
    ])
  ];
  res.type('html').send(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Podglądy wiadomości Durmstrangu</title></head><body style="font-family:Georgia,serif;background:#090c12;color:#eee;padding:32px"><h1>Podglądy wiadomości Durmstrangu</h1><p>Te widoki nie tworzą kont i nie wysyłają wiadomości.</p><ul>${links.map(([label, href]) => `<li style="margin:12px 0"><a style="color:#d7bc76" href="${href}">${label}</a></li>`).join('')}</ul></body></html>`);
});

router.get('/account-created', (req, res) => {
  const rendered = renderEmailPreview(EMAIL_TYPES.ACCOUNT_CREATED, {
    id: 'preview-account-created',
    full_name: 'Podgląd Adepta',
    email: 'preview@example.test',
    house: null
  });
  res.type('html').send(rendered.html);
});

router.get('/account-approved/:house', (req, res) => {
  const house = String(req.params.house || '').toLowerCase();
  if (!HOUSE_EMAIL_THEMES[house]) {
    return res.status(404).send('Nieznany Zakon. Dostępne: reinhall, bjornhall, ravnheim, otergard.');
  }
  const rendered = renderEmailPreview(EMAIL_TYPES.ACCOUNT_APPROVED, {
    id: `preview-account-approved-${house}`,
    full_name: 'Podgląd Adepta',
    email: 'preview@example.test',
    house
  });
  res.type('html').send(rendered.html);
});

export default router;
