export const EMAIL_TYPES = Object.freeze({
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_APPROVED: 'account_approved'
});

export const EMAIL_SUBJECTS = Object.freeze({
  [EMAIL_TYPES.ACCOUNT_CREATED]: 'Twierdza Magii Durmstrang — Twoje zgłoszenie zostało przyjęte',
  [EMAIL_TYPES.ACCOUNT_APPROVED]: 'Twierdza Magii Durmstrang — Rada Arcymistrzów podjęła decyzję'
});

export const HOUSE_EMAIL_THEMES = Object.freeze({
  reinhall: { name: 'Reinhall', rune: 'ᚦ', accent: '#8c6a2f', dark: '#4d1717', pale: '#f2e4c3' },
  bjornhall: { name: 'Björnhall', rune: 'ᛉ', accent: '#8e2e2e', dark: '#202530', pale: '#ead8d5' },
  ravnheim: { name: 'Ravnheim', rune: 'ᚱ', accent: '#725294', dark: '#21162f', pale: '#e5d9ed' },
  otergard: { name: 'Otergard', rune: 'ᛞ', accent: '#277e78', dark: '#12363a', pale: '#d6ebe6' }
});

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const stripTrailingSlash = (value = '') => String(value).replace(/\/+$/, '');

export function buildApplicationUrl(appUrl, hashPath = '') {
  const base = stripTrailingSlash(appUrl);
  return `${base}/${hashPath.startsWith('#') ? hashPath : `#${hashPath}`}`;
}

function preheader(text) {
  return `<div style="display:none;font-size:1px;color:#0a0d13;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(text)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`;
}

function paragraph(content) {
  return `<p style="Margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.72;color:#27231d;">${content}</p>`;
}

function ctaButton(label, href, accent = '#735a25') {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <div style="text-align:center;Margin:7px 0 25px 0;">
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="background-color:${accent};border:1px solid #4b3a18;border-radius:2px;color:#fff9e9;display:inline-block;font-family:Georgia,'Times New Roman',serif;font-size:12px;font-weight:bold;letter-spacing:1.3px;line-height:18px;padding:13px 22px;text-align:center;text-decoration:none;text-transform:uppercase;mso-padding-alt:0;">${safeLabel}</a>
    </div>`;
}

function signatureSection(signatureSrc) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:13px 0 0 0;text-align:left;">
          <p style="Margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.55;color:#27231d;">Z poważaniem<br><strong>Rada Arcymistrzów</strong><br>Twierdzy Magii Durmstrang</p>
        </td>
      </tr>
      <tr>
        <td class="signature-cell" style="padding:10px 0 0 0;text-align:left;">
          <img src="${escapeHtml(signatureSrc)}" width="420" alt="Podpis Rady Arcymistrzów Twierdzy Magii Durmstrang" style="border:0;display:block;height:auto;max-width:100%;width:420px;color:#27231d;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:20px;">
        </td>
      </tr>
    </table>`;
}

function layout({ preheaderText, documentLabel, title, content, herbSrc, signatureSrc, footerText, accent = '#8d7133', ceremonial = false }) {
  return `<!doctype html>
<html lang="pl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    html,body{margin:0!important;padding:0!important;width:100%!important;background:#07090d!important}
    table,td{border-collapse:collapse!important;mso-table-lspace:0pt!important;mso-table-rspace:0pt!important}
    img{-ms-interpolation-mode:bicubic}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
    @media only screen and (max-width:680px){
      .email-shell{width:100%!important}
      .outer-pad{padding:12px 7px!important}
      .paper-pad{padding:30px 23px 28px!important}
      .fortress-title{font-size:20px!important;letter-spacing:2px!important}
      .document-title{font-size:11px!important;letter-spacing:1.4px!important}
      .signature-cell img{width:100%!important;max-width:420px!important}
      .house-name{font-size:31px!important;letter-spacing:2px!important}
    }
  </style>
</head>
<body style="Margin:0;padding:0;background-color:#07090d;">
  ${preheader(preheaderText)}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#07090d;">
    <tr>
      <td class="outer-pad" align="center" style="padding:28px 10px;">
        <table role="presentation" class="email-shell" width="648" cellspacing="0" cellpadding="0" border="0" style="width:648px;max-width:648px;background:#10141c;border:1px solid #3e3a30;box-shadow:0 12px 40px rgba(0,0,0,.55);">
          <tr>
            <td align="center" style="padding:${ceremonial ? '28px 30px 24px' : '24px 30px 20px'};background:#0b1018;border-bottom:3px double ${accent};">
              <img src="${escapeHtml(herbSrc)}" width="${ceremonial ? '94' : '78'}" alt="Herb Twierdzy Magii Durmstrang" style="border:0;display:block;height:auto;margin:0 auto ${ceremonial ? '13px' : '10px'};width:${ceremonial ? '94px' : '78px'};color:#d8c895;font-family:Georgia,'Times New Roman',serif;font-size:13px;">
              <div class="fortress-title" style="font-family:Georgia,'Times New Roman',serif;font-size:${ceremonial ? '23px' : '21px'};font-weight:bold;letter-spacing:3px;line-height:1.3;color:#e3d6ad;text-transform:uppercase;">Twierdza Magii Durmstrang</div>
              <div style="margin-top:8px;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:5px;color:#8c866f;">ᚦ &nbsp; ᛉ &nbsp; ᚱ &nbsp; ᛞ</div>
              <div class="document-title" style="margin-top:12px;font-family:Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:2px;line-height:1.45;color:#aaa184;text-transform:uppercase;">${escapeHtml(documentLabel)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 12px 12px;background:#10141c;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#e7dcc4;border-left:1px solid #b4a47c;border-right:1px solid #b4a47c;border-bottom:1px solid #b4a47c;">
                <tr>
                  <td class="paper-pad" style="padding:${ceremonial ? '42px 48px 36px' : '38px 48px 34px'};background-color:#e7dcc4;">
                    <div style="height:1px;background:#aa9259;margin:0 0 7px;"></div>
                    <div style="height:1px;background:#c6b78f;margin:0 0 28px;"></div>
                    ${content}
                    ${signatureSection(signatureSrc)}
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:25px;border-collapse:collapse;">
                      <tr>
                        <td style="border-top:1px solid #b9aa82;padding-top:15px;text-align:center;">
                          <div style="display:inline-block;width:58px;height:58px;border:2px solid ${accent};border-radius:50%;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:54px;color:${accent};text-align:center;">ᛞ</div>
                          <div style="margin-top:9px;font-family:Arial,sans-serif;font-size:9px;letter-spacing:1.2px;line-height:1.55;color:#766f61;text-transform:uppercase;">Pieczęć Rady Arcymistrzów • Pakt 1294</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:13px 28px 18px;background:#10141c;text-align:center;font-family:Arial,sans-serif;font-size:10px;line-height:1.55;color:#7d8290;">${escapeHtml(footerText)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderAccountCreatedEmail({ herbSrc, signatureSrc }) {
  const content = `
    <h1 style="Margin:0 0 23px;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.35;color:#201d18;font-weight:normal;">Drogi Czarodzieju,</h1>
    ${paragraph('Z przyjemnością informujemy, że Twoje konto na stronie Twierdzy Magii Durmstrang zostało pomyślnie utworzone. Stawiasz właśnie pierwszy krok na ścieżce ku zgłębianiu tajników potężnej wiedzy i dyscypliny.')}
    ${paragraph('Pragniemy jednak zaznaczyć, że pełny dostęp do zasobów naszej Twierdzy oraz możliwość logowania nastąpi dopiero po przeprowadzeniu weryfikacji i uzyskaniu formalnej akceptacji ze strony Rady Arcymistrzów. Dbamy o to, aby w nasze mury wstępowali jedynie ci, którzy wykazują należytą determinację i szacunek dla tradycji.')}
    <div style="margin:25px 0;padding:17px 18px;border-left:3px solid #8d7133;background:#dbcfb5;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.65;color:#2e2a22;">O zakończeniu procesu weryfikacji oraz odblokowaniu dostępu do konta zostaniesz poinformowany w osobnej wiadomości.</div>`;

  const text = `Drogi Czarodzieju,\n\nZ przyjemnością informujemy, że Twoje konto na stronie Twierdzy Magii Durmstrang zostało pomyślnie utworzone. Stawiasz właśnie pierwszy krok na ścieżce ku zgłębianiu tajników potężnej wiedzy i dyscypliny.\n\nPragniemy jednak zaznaczyć, że pełny dostęp do zasobów naszej Twierdzy oraz możliwość logowania nastąpi dopiero po przeprowadzeniu weryfikacji i uzyskaniu formalnej akceptacji ze strony Rady Arcymistrzów. Dbamy o to, aby w nasze mury wstępowali jedynie ci, którzy wykazują należytą determinację i szacunek dla tradycji.\n\nO zakończeniu procesu weryfikacji oraz odblokowaniu dostępu do konta zostaniesz poinformowany w osobnej wiadomości.\n\nZ poważaniem\nRada Arcymistrzów\nTwierdzy Magii Durmstrang`;

  return {
    subject: EMAIL_SUBJECTS[EMAIL_TYPES.ACCOUNT_CREATED],
    text,
    html: layout({
      preheaderText: 'Twoje konto zostało utworzone i oczekuje na weryfikację Rady Arcymistrzów.',
      documentLabel: 'Potwierdzenie przyjęcia zgłoszenia',
      title: EMAIL_SUBJECTS[EMAIL_TYPES.ACCOUNT_CREATED],
      content,
      herbSrc,
      signatureSrc,
      footerText: 'Wiadomość transakcyjna dotycząca zgłoszenia złożonego w Twierdzy Magii Durmstrang.'
    })
  };
}

export function renderAccountApprovedEmail({ house, statuteUrl, discordUrl, vademecumUrl, herbSrc, signatureSrc }) {
  const houseTheme = HOUSE_EMAIL_THEMES[String(house || '').toLowerCase()];
  if (!houseTheme) throw new Error(`Nieznany Zakon użytkownika: ${house || 'brak'}`);

  const content = `
    <h1 style="Margin:0 0 23px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.35;color:#201d18;font-weight:normal;">Drogi Czarodzieju,</h1>
    ${paragraph('Z przyjemnością ogłaszamy, że Rada Arcymistrzów podjęła decyzję — weryfikacja Twojego profilu przebiegła pomyślnie i od tej chwili oficjalnie zasilasz szeregi uczniów Twierdzy Magii Durmstrang!')}
    ${paragraph('Oto decyzja dotycząca Twojej ścieżki, którą podjęła Tiara Przydziału:')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 27px;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:24px 16px;background:${houseTheme.dark};border-top:3px double ${houseTheme.accent};border-bottom:3px double ${houseTheme.accent};">
          <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:2px;line-height:1.5;color:${houseTheme.pale};text-transform:uppercase;">Tiara Przydziału wybrała</div>
          <div style="margin:7px 0 2px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1;color:${houseTheme.accent};">${houseTheme.rune}</div>
          <div class="house-name" style="font-family:Georgia,'Times New Roman',serif;font-size:39px;font-weight:bold;letter-spacing:4px;line-height:1.25;color:#fff8e8;text-transform:uppercase;">${escapeHtml(houseTheme.name)}</div>
        </td>
      </tr>
    </table>
    ${paragraph('Twoje konto na stronie szkoły uzyskało pełne uprawnienia. Otrzymujesz dostęp do zablokowanych dotąd sekcji, materiałów dydaktycznych oraz zamkniętych komnat Zakonu. Zanim jednak rzucisz się w wir nauki i magicznych praktyk, zapoznaj się z panującymi u nas zasadami oraz regulaminami.')}
    ${ctaButton('Statut Twierdzy Magii Durmstrang', statuteUrl, houseTheme.accent)}
    ${paragraph('Pamiętaj, że całe serce naszej społeczności — od codziennych rozmów, zajęć aż po wydarzenia szkolne — bije na Discordzie!')}
    ${ctaButton('Serwer Discord', discordUrl, houseTheme.accent)}
    ${paragraph('Dla wszystkich nowo przybyłych czarodziejów przygotowaliśmy również praktyczny przewodnik, który przeprowadzi Cię przez pierwsze kroki w Twierdzy Magii Durmstrang:')}
    ${ctaButton('Vademecum Durmstrangu', vademecumUrl, houseTheme.accent)}
    ${paragraph('W razie jakichkolwiek pytań lub wątpliwości, nasi Arcymistrzowie oraz społeczność szkolna zawsze służą pomocą.')}
    <p style="Margin:29px 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-style:italic;line-height:1.65;color:#3b3022;text-align:center;">„Niech potęga i wiedza prowadzą Cię przez mury Durmstrangu!”</p>`;

  const text = `Drogi Czarodzieju,\n\nZ przyjemnością ogłaszamy, że Rada Arcymistrzów podjęła decyzję — weryfikacja Twojego profilu przebiegła pomyślnie i od tej chwili oficjalnie zasilasz szeregi uczniów Twierdzy Magii Durmstrang!\n\nOto decyzja dotycząca Twojej ścieżki, którą podjęła Tiara Przydziału:\n\nTIARA PRZYDZIAŁU WYBRAŁA\n${houseTheme.name.toUpperCase()}\n\nTwoje konto na stronie szkoły uzyskało pełne uprawnienia. Otrzymujesz dostęp do zablokowanych dotąd sekcji, materiałów dydaktycznych oraz zamkniętych komnat Zakonu. Zanim jednak rzucisz się w wir nauki i magicznych praktyk, zapoznaj się z panującymi u nas zasadami oraz regulaminami.\n\nSTATUT TWIERDZY MAGII DURMSTRANG: ${statuteUrl}\n\nPamiętaj, że całe serce naszej społeczności — od codziennych rozmów, zajęć aż po wydarzenia szkolne — bije na Discordzie!\n\nSERWER DISCORD: ${discordUrl}\n\nDla wszystkich nowo przybyłych czarodziejów przygotowaliśmy również praktyczny przewodnik, który przeprowadzi Cię przez pierwsze kroki w Twierdzy Magii Durmstrang:\n\nVADEMECUM DURMSTRANGU: ${vademecumUrl}\n\nW razie jakichkolwiek pytań lub wątpliwości, nasi Arcymistrzowie oraz społeczność szkolna zawsze służą pomocą.\n\n„Niech potęga i wiedza prowadzą Cię przez mury Durmstrangu!”\n\nZ poważaniem\nRada Arcymistrzów\nTwierdzy Magii Durmstrang`;

  return {
    subject: EMAIL_SUBJECTS[EMAIL_TYPES.ACCOUNT_APPROVED],
    text,
    html: layout({
      preheaderText: 'Weryfikacja zakończona. Poznaj decyzję Rady Arcymistrzów i swój Zakon.',
      documentLabel: 'Oficjalny list przyjęcia do Twierdzy',
      title: EMAIL_SUBJECTS[EMAIL_TYPES.ACCOUNT_APPROVED],
      content,
      herbSrc,
      signatureSrc,
      footerText: 'Wiadomość transakcyjna dotycząca decyzji Rady Arcymistrzów i dostępu do konta.',
      accent: houseTheme.accent,
      ceremonial: true
    })
  };
}

export function renderTransactionalEmail(type, data) {
  if (type === EMAIL_TYPES.ACCOUNT_CREATED) return renderAccountCreatedEmail(data);
  if (type === EMAIL_TYPES.ACCOUNT_APPROVED) return renderAccountApprovedEmail(data);
  throw new Error(`Nieobsługiwany typ wiadomości: ${type}`);
}
