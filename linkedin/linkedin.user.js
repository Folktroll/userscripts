// ==UserScript==
// @name         [FT] LinkedIn Experience Scraper
// @namespace    https://github.com/Folktroll/userscripts/linkedin
// @version      26.2.27.706
// @description  Extracts LinkedIn experience and copies to clipboard (Alt+C+C)
// @author       Folktroll
// @icon         https://raw.githubusercontent.com/Folktroll/userscripts/refs/heads/main/linkedin/icon.png
// @match        https://*.linkedin.com/in/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      linkedin.com
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/Folktroll/userscripts/refs/heads/main/linkedin/linkedin.user.js
// @downloadURL  https://raw.githubusercontent.com/Folktroll/userscripts/refs/heads/main/linkedin/linkedin.user.js
// @license      MIT
// ==/UserScript==

'use strict';

const TITLE_MAP = {
  'Daglig leder':                       'CEO',
  'Styrets leder':                      'Chairman',
  'Styremedlem':                        'Board Member',
  'Varamedlem':                         'Deputy Board Member',
  'Nestleder':                          'Deputy Chairman',
  'Verkställande direktör':             'CEO',
  'Ordförande':                         'Chairman',
  'Ledamot':                            'Board Member',
  'Suppleant':                          'Deputy Board Member',
  'Extern verkställande direktör':      'CEO',
  'Extern vice verkställande direktör': 'Deputy CEO',
  'Owner':                              'owner',
  'Founder':                            'founder',
  'gründer':                            'founder',
  'salgssjef':                          'Sales Manager',
  'salgsleder':                         'Sales Manager',
  'salgsrepresentant':                  'Sales Representative',
  'salgs representant':                 'Sales Representative',
  'markedssjef':                        'Marketing Manager',
  'Avdelingsleder':                     'Head of Department',
  'Gruppeleder':                        'Team Leader',
  'Rådgiver':                           'Adviser',
  'Analytiker':                         'Analyst',
  'Member of the Board':                'Board Member',
  'Styreleder':                         'Chairman',
  'Administrerende direktør':           'CEO',
  'Adm. dir.':                          'CEO',
  'prosjektleder':                      'Project Manager',
  'Prosjektleder':                      'Project Manager',
  'Teknisk sjef':                       'Technical Manager',
  'Salgsdirektor':                      'Sales Director',
  'Avdelingssjef':                      'Head of Department',
  'Økonomisjef':                        'Finance Manager',
  'Okonomisjef':                        'Finance Manager',
};

const EXTRA_MAP = { AE: 'Ae' };

const DIACRITICS = {
  À:"A", Á:"A", Â:"A", Ã:"A", Ä:"A", Å:"A",
  Ấ:"A", Ắ:"A", Ẳ:"A", Ẵ:"A", Ặ:"A", Æ:"AE",
  Ầ:"A", Ằ:"A", Ȃ:"A", Ç:"C", Ḉ:"C",
  È:"E", É:"E", Ê:"E", Ë:"E", Ế:"E", Ḗ:"E",
  Ề:"E", Ḕ:"E", Ḝ:"E", Ȇ:"E",
  Ì:"I", Í:"I", Î:"I", Ï:"I", Ḯ:"I", Ȋ:"I",
  Ð:"D", Ñ:"N",
  Ò:"O", Ó:"O", Ô:"O", Õ:"O", Ö:"O", Ø:"O",
  Ố:"O", Ṍ:"O", Ṓ:"O", Ȏ:"O",
  Ù:"U", Ú:"U", Û:"U", Ü:"U", Ý:"Y",
  à:"a", á:"a", â:"a", ã:"a", ä:"a", å:"a",
  ấ:"a", ắ:"a", ẳ:"a", ẵ:"a", ặ:"a", æ:"ae",
  ầ:"a", ằ:"a", ȃ:"a", ç:"c", ḉ:"c",
  è:"e", é:"e", ê:"e", ë:"e", ế:"e", ḗ:"e",
  ề:"e", ḕ:"e", ḝ:"e", ȇ:"e",
  ì:"i", í:"i", î:"i", ï:"i", ḯ:"i", ȋ:"i",
  ð:"d", ñ:"n",
  ò:"o", ó:"o", ô:"o", õ:"o", ö:"o", ø:"o",
  ố:"o", ṍ:"o", ṓ:"o", ȏ:"o",
  ù:"u", ú:"u", û:"u", ü:"u", ý:"y", ÿ:"y",
  Ā:"A", ā:"a", Ă:"A", ă:"a", Ą:"A", ą:"a",
  Ć:"C", ć:"c", Ĉ:"C", ĉ:"c", Ċ:"C", ċ:"c",
  Č:"C", č:"c", Ď:"D", ď:"d", Đ:"D", đ:"d",
  Ē:"E", ē:"e", Ĕ:"E", ĕ:"e", Ė:"E", ė:"e",
  Ę:"E", ę:"e", Ě:"E", ě:"e",
  Ĝ:"G", ĝ:"g", Ğ:"G", ğ:"g", Ġ:"G", ġ:"g",
  Ģ:"G", ģ:"g", Ĥ:"H", ĥ:"h", Ħ:"H", ħ:"h",
  Ĩ:"I", ĩ:"i", Ī:"I", ī:"i", Ĭ:"I", ĭ:"i",
  Į:"I", į:"i", İ:"I", ı:"i",
  Ĵ:"J", ĵ:"j", Ķ:"K", ķ:"k",
  Ĺ:"L", ĺ:"l", Ļ:"L", ļ:"l", Ľ:"L", ľ:"l",
  Ŀ:"L", ŀ:"l", Ł:"l", ł:"l",
  Ń:"N", ń:"n", Ņ:"N", ņ:"n", Ň:"N", ň:"n",
  Ō:"O", ō:"o", Ŏ:"O", ŏ:"o", Ő:"O", ő:"o",
  Œ:"OE", œ:"oe",
  Ŕ:"R", ŕ:"r", Ŗ:"R", ŗ:"r", Ř:"R", ř:"r",
  Ś:"S", ś:"s", Ŝ:"S", ŝ:"s", Ş:"S", ş:"s",
  Ș:"S", ș:"s", Š:"S", š:"s",
  Ţ:"T", ţ:"t", Ț:"T", ț:"t", Ť:"T", ť:"t",
  Ŧ:"T", ŧ:"t",
  Ũ:"U", ũ:"u", Ū:"U", ū:"u", Ŭ:"U", ŭ:"u",
  Ů:"U", ů:"u", Ű:"U", ű:"u", Ų:"U", ų:"u",
  Ŵ:"W", ŵ:"w", Ẃ:"W", ẃ:"w",
  Ŷ:"Y", ŷ:"y", Ÿ:"Y",
  Ź:"Z", ź:"z", Ż:"Z", ż:"z", Ž:"Z", ž:"z",
  ƒ:"f", Ơ:"O", ơ:"o", Ư:"U", ư:"u",
  Ǎ:"A", ǎ:"a", Ǐ:"I", ǐ:"i", Ǒ:"O", ǒ:"o",
  Ǔ:"U", ǔ:"u", Ǻ:"A", ǻ:"a", Ǽ:"AE", ǽ:"ae",
  Ǿ:"O", ǿ:"o", Þ:"TH", þ:"th",
};

const DIACRITIC_RE    = new RegExp(Object.keys(DIACRITICS).join('|'), 'g');
const removeDiacritics = (s) => s.replace(DIACRITIC_RE, (c) => DIACRITICS[c] ?? c);

const profileCache = {};
let lastHref = location.href;

const getSlug = () => location.pathname.split('/')[2] ?? null;

const getOrCreateProfile = (slug) => {
  if (!Object.prototype.hasOwnProperty.call(profileCache, slug))
    profileCache[slug] = { name: '', copyStr: '', totalExp: 0 };
  return profileCache[slug];
};

const applyTranslations = (text) => {
  for (const [from, to] of Object.entries(TITLE_MAP)) text = text.replaceAll(from, to);
  text = removeDiacritics(text);
  for (const [from, to] of Object.entries(EXTRA_MAP)) text = text.replaceAll(from, to);
  return text;
};

const formatEntry = (company, title, dates) => {
  if (company.includes('·')) company = company.slice(0, company.indexOf('·')).trim();
  if (dates.includes('·'))   dates   = dates.slice(0, dates.indexOf('·')).trim();

  title = title.replaceAll(/_+/g, '');
  dates = dates.replaceAll(/[^0-9-]+/g, '');
  dates = dates.replace(/(\d{4})-\1/, '$1');

  return `- ${company.trim()}, ${title.trim()}, ${dates.trim() || 'n/a'}`.replaceAll(/\s+/g, ' ') + '\r\n';
};

const parseExperienceList = (olElement, name, profile) => {
  let text = '';

  for (const li of olElement.querySelectorAll(':scope > li.profile-entity-lockup')) {
    if (!li.classList.contains('grouped')) {
      const company = li.querySelector('div.self-center > div:nth-child(2)')?.textContent?.trim() ?? '[n/a]';
      const title   = li.querySelector('div.self-center > div:nth-child(1)')?.textContent?.trim() ?? '[n/a]';
      const spans   = li.querySelectorAll('div.self-center > div:nth-child(3) > span');
      const dates   = ((spans[0]?.textContent ?? '') + (spans[1]?.textContent ?? '')).trim() || '[n/a]';
      text += formatEntry(company, title, dates);
    } else {
      const company = li.querySelector('div.list-item-heading')?.textContent?.trim() ?? '[n/a]';
      for (const roleDiv of li.querySelectorAll('ul > li > div:nth-child(2)')) {
        const title = roleDiv.querySelector('div:nth-child(1)')?.textContent?.trim() ?? '[n/a]';
        const spans = roleDiv.querySelectorAll('div:nth-child(2) > span');
        const dates = ((spans[0]?.textContent ?? '') + (spans[1]?.textContent ?? '')).trim() || '[n/a]';
        text += formatEntry(company, title, dates);
      }
    }
  }

  if (!text) {
    showToast('Could not parse experience section', 'error');
    return;
  }

  profile.name     = name;
  profile.copyStr  = applyTranslations(text);
  profile.totalExp = profile.copyStr.split('\r\n').filter(Boolean).length;

  showSuccessToast(profile);
};

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

const fetchData = () => {
  if (!location.href.includes('linkedin.com/in') || location.href.includes('.html')) return;

  const slug = getSlug();
  if (!slug) return;

  const profile = getOrCreateProfile(slug);

  if (profile.copyStr.length > 0) {
    showSuccessToast(profile);
    return;
  }

  showToast('⏳ Fetching…', 'info');

  GM_xmlhttpRequest({
    method: 'GET',
    url:    `https://www.linkedin.com/in/${encodeURIComponent(slug)}/`,
    headers: {
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent':      MOBILE_UA,
    },
    onload(response) {
      if (response.status < 200 || response.status >= 300) {
        showToast(`HTTP ${response.status}`, 'error');
        return;
      }

      // DOMParser is blocked by ScriptCat's Trusted Types sanitizer,
      // so we load the HTML via a Blob URL into a hidden iframe instead
      const iframe  = document.createElement('iframe');
      iframe.style.cssText = 'display:none;position:fixed;left:-9999px;width:0;height:0;';
      document.body.appendChild(iframe);

      const blobUrl = URL.createObjectURL(new Blob([response.responseText], { type: 'text/html' }));

      iframe.onload = () => {
        const doc  = iframe.contentDocument;
        const ol   = doc.querySelector('section.experience-container > ol');
        const name = doc.querySelector('h1.heading-large')?.textContent?.trim();

        URL.revokeObjectURL(blobUrl);
        iframe.remove();

        ol && name !== undefined
          ? parseExperienceList(ol, name, profile)
          : showToast('😞 Experience section not found', 'error');
      };

      iframe.src = blobUrl;
    },
    onerror(err) {
      console.error('[FT] fetch error:', err);
      showToast('😞 Network error', 'error');
    },
  });
};

const TOAST_BG = {
  info:    'rgba(0,65,130,0.92)',
  error:   'rgba(160,20,20,0.92)',
  success: 'rgba(5,118,66,0.88)',
};

const showToast = (html, type = 'info', duration = 5000, onClick = null) => {
  const el = document.createElement('div');

  Object.assign(el.style, {
    position:     'fixed',
    top:          '80px',
    right:        '16px',
    zIndex:       '2147483647',
    background:   TOAST_BG[type] ?? TOAST_BG.info,
    color:        '#eee',
    padding:      '10px 18px',
    borderRadius: '50px',
    minWidth:     '280px',
    maxWidth:     '420px',
    textAlign:    'center',
    fontFamily:   'Calibri, "Segoe UI", Arial, sans-serif',
    fontVariant:  'small-caps',
    fontWeight:   '600',
    fontSize:     '14px',
    boxShadow:    '0 4px 16px rgba(0,0,0,0.3)',
    cursor:       onClick ? 'pointer' : 'default',
    opacity:      '0',
    transition:   'opacity 0.3s ease',
    userSelect:   'none',
  });

  el.innerHTML = html;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });

  const dismiss = () => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 350);
  };

  if (onClick) el.addEventListener('click', () => { onClick(); dismiss(); });

  const timer = setTimeout(dismiss, duration);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => setTimeout(dismiss, 1500));
};

const showSuccessToast = (profile) => showToast(
  `<b><i>${profile.name}</i></b>: ${profile.totalExp} exp. <small style="opacity:.7">(click to copy)</small>`,
  'success',
  5000,
  () => GM_setClipboard(profile.copyStr),
);

// Alt+C+C shortcut
(() => {
  let lastKey = '';
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyC') {
      if (lastKey === 'alt+c') {
        const slug    = getSlug();
        const profile = slug && profileCache[slug];
        if (!profile?.copyStr) { fetchData(); return; }
        GM_setClipboard(profile.copyStr);
        showToast(`👍 ${profile.name}: ${profile.totalExp} positions`, 'info');
        lastKey = '';
        return;
      }
      lastKey = 'alt+c';
      return;
    }
    lastKey = '';
  });
})();

// SPA navigation
new MutationObserver(() => {
  if (lastHref !== location.href) {
    lastHref = location.href;
    fetchData();
  }
}).observe(document.body, { subtree: true, childList: true });

fetchData();
