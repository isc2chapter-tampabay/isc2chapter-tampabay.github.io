// Client-side data fetching from D1 API
// Replaces static Eleventy-rendered content with live data

(function () {
  const API = '/api';
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function isFuture(dateStr) {
    const d = parseDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  }
  function dateMonth(dateStr) { return MONTHS[parseInt(dateStr.split('-')[1]) - 1]; }
  function dateDay(dateStr) { return parseInt(dateStr.split('-')[2]); }
  function dateDow(dateStr) { return DAYS[parseDate(dateStr).getDay()]; }
  function dateFormatLong(dateStr) {
    const p = dateStr.split('-');
    return MONTHS_LONG[parseInt(p[1]) - 1] + ' ' + parseInt(p[2]) + ', ' + p[0];
  }
  function formatEventTime(ev) {
    const st = ev.startTime || ev.start_time;
    const et = ev.endTime || ev.end_time;
    return st + ' - ' + et;
  }
  function esc(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }
  function el(tag, attrs, html) {
    const node = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (v != null) node.setAttribute(k, v);
    });
    if (html) node.textContent = html;
    return node;
  }

  // ── Events Page ──
  async function loadEventsPage() {
    const container = document.getElementById('events-dynamic');
    if (!container) return;
    try {
      const res = await fetch(API + '/events');
      const events = await res.json();
      // Map D1 fields
      const mapped = events.map(e => ({
        ...e,
        startTime: e.start_time,
        endTime: e.end_time,
        endDate: e.end_date
      }));
      const upcoming = mapped.filter(e => isFuture(e.date)).sort((a, b) => a.date.localeCompare(b.date));
      const past = mapped.filter(e => !isFuture(e.date)).sort((a, b) => b.date.localeCompare(a.date));
      container.replaceChildren();

      if (upcoming.length) {
        container.appendChild(buildSectionLabel('Coming Up'));
        const h2 = el('h2', { class: 'events-page-title' }, 'Upcoming Events');
        container.appendChild(h2);
        const wrap = el('div', { class: 'upcoming-events' });
        upcoming.forEach(ev => wrap.appendChild(buildEventCard(ev, true)));
        container.appendChild(wrap);
      }

      if (past.length) {
        const label = buildSectionLabel('Archive');
        label.style.marginTop = '48px';
        container.appendChild(label);
        container.appendChild(el('h3', { class: 'events-section-heading' }, 'Past Events'));
        past.forEach(ev => container.appendChild(buildEventCard(ev, false)));
      }

      const footer = el('p', { class: 'events-footer-note' });
      footer.textContent = 'Follow us on ';
      const link = el('a', { href: 'https://www.linkedin.com/company/isc2-tampa-bay-chapter/' }, 'LinkedIn');
      footer.appendChild(link);
      footer.appendChild(document.createTextNode(' for the latest announcements.'));
      container.appendChild(footer);
    } catch { /* keep static fallback */ }
  }

  function buildSectionLabel(text) {
    const span = el('span', { class: 'section-label', style: 'display:block;text-align:center;' }, text);
    return span;
  }

  function buildDateBadge(dateStr) {
    const badge = el('div', { class: 'event-date-badge' });
    badge.appendChild(el('span', { class: 'event-date-month' }, dateMonth(dateStr)));
    badge.appendChild(el('span', { class: 'event-date-day' }, String(dateDay(dateStr))));
    badge.appendChild(el('span', { class: 'event-date-dow' }, dateDow(dateStr)));
    return badge;
  }

  function buildEventCard(ev, isUpcoming) {
    const card = document.createElement('div');
    card.className = 'event-card event-card--' + (ev.type || 'chapter');
    if (isUpcoming) card.classList.add('animate-on-scroll');

    // Date group
    const dateGroup = el('div', { class: 'event-date-group' });
    dateGroup.appendChild(buildDateBadge(ev.date));
    if (ev.endDate) {
      dateGroup.appendChild(el('span', { class: 'event-date-sep' }, '-'));
      dateGroup.appendChild(buildDateBadge(ev.endDate));
    }
    card.appendChild(dateGroup);

    // Logo
    if (ev.image) {
      const img = el('img', { class: 'event-logo-img', src: ev.image, alt: ev.title });
      card.appendChild(img);
    } else {
      const logo = el('div', { class: 'event-logo event-logo--' + (ev.type || 'chapter') });
      const span = document.createElement('span');
      span.textContent = ev.type === 'community' ? 'BSides Tampa' : 'ISC2 Chapter';
      logo.appendChild(span);
      card.appendChild(logo);
    }

    // Details
    const details = el('div', { class: 'event-details' });
    details.appendChild(el('h3', { class: 'event-title' }, ev.title));
    if (ev.description) details.appendChild(el('p', { class: 'event-description' }, ev.description));

    const meta = el('div', { class: 'event-meta' });
    const timePill = el('span', { class: 'event-meta-pill' });
    timePill.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>');
    timePill.appendChild(document.createTextNode(' ' + formatEventTime(ev)));
    meta.appendChild(timePill);

    const locPill = el('span', { class: 'event-meta-pill' });
    locPill.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>');
    locPill.appendChild(document.createTextNode(' ' + ev.location));
    meta.appendChild(locPill);

    if (ev.url) {
      const detailLink = el('a', { href: ev.url, class: 'event-meta-pill event-meta-link' }, 'Details →');
      meta.appendChild(detailLink);
    }
    if (isUpcoming && ev.type === 'community') {
      const scholarLink = el('a', { href: '/scholarships/', class: 'event-meta-pill event-meta-scholarship' });
      scholarLink.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>');
      scholarLink.appendChild(document.createTextNode(' Scholarships Available'));
      meta.appendChild(scholarLink);
    }
    details.appendChild(meta);
    card.appendChild(details);
    return card;
  }

  // ── Resources Page ──
  async function loadResourcesPage() {
    const container = document.getElementById('resources-dynamic');
    if (!container) return;
    try {
      const res = await fetch(API + '/presentations');
      const presentations = await res.json();
      presentations.sort((a, b) => b.date.localeCompare(a.date));

      // Get unique years
      const years = [...new Set(presentations.map(p => p.date.split('-')[0]))].sort().reverse();

      container.replaceChildren();
      for (const year of years) {
        container.appendChild(el('h3', { class: 'resource-year-heading' }, year));
        const grid = el('div', { class: 'resource-grid' });
        const yearPres = presentations.filter(p => p.date.startsWith(year));

        for (const pres of yearPres) {
          const card = el('div', { class: 'resource-card animate-on-scroll' });

          if (pres.image) {
            const photoDiv = el('div', { class: 'resource-card-photo' });
            photoDiv.appendChild(el('img', { src: pres.image, alt: pres.speaker || '' }));
            card.appendChild(photoDiv);
          }

          const body = el('div', { class: 'resource-card-body' });
          body.appendChild(el('h4', { class: 'resource-card-title' }, pres.title));

          // Meta
          const metaP = el('p', { class: 'resource-card-meta' });
          if (pres.speaker) {
            const speakerSpan = el('span', { class: 'resource-speaker' });
            speakerSpan.insertAdjacentHTML('afterbegin', '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> ');
            if (pres.linkedin) {
              const a = el('a', { href: pres.linkedin, target: '_blank', rel: 'noopener' }, pres.speaker);
              speakerSpan.appendChild(a);
            } else {
              speakerSpan.appendChild(document.createTextNode(pres.speaker));
            }
            metaP.appendChild(speakerSpan);
          }
          const dateSpan = el('span', { class: 'resource-date' });
          dateSpan.insertAdjacentHTML('afterbegin', '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg> ');
          dateSpan.appendChild(document.createTextNode(dateFormatLong(pres.date)));
          metaP.appendChild(dateSpan);
          body.appendChild(metaP);

          body.appendChild(el('p', { class: 'resource-card-event' }, pres.event));
          if (pres.description) body.appendChild(el('p', { class: 'resource-card-desc' }, pres.description));

          // Tags
          const tags = pres.tags || [];
          if (tags.length) {
            const tagsDiv = el('div', { class: 'resource-tags' });
            tags.forEach(t => tagsDiv.appendChild(el('span', { class: 'resource-tag' }, t)));
            body.appendChild(tagsDiv);
          }
          card.appendChild(body);

          // Actions
          if (pres.slides || pres.video) {
            const actions = el('div', { class: 'resource-card-actions' });
            if (pres.slides) {
              const a = el('a', { href: pres.slides, class: 'resource-action', target: '_blank', rel: 'noopener' });
              a.insertAdjacentHTML('afterbegin', '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM6 20V4h5v7h7v9H6z"/></svg> ');
              a.appendChild(document.createTextNode('Slides'));
              actions.appendChild(a);
            }
            if (pres.video) {
              const a = el('a', { href: pres.video, class: 'resource-action', target: '_blank', rel: 'noopener' });
              a.insertAdjacentHTML('afterbegin', '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg> ');
              a.appendChild(document.createTextNode('Recording'));
              actions.appendChild(a);
            }
            card.appendChild(actions);
          }
          grid.appendChild(card);
        }
        container.appendChild(grid);
      }
    } catch { /* keep static fallback */ }
  }

  // ── Homepage Upcoming Events ──
  async function loadHomeUpcoming() {
    const container = document.getElementById('home-events-dynamic');
    if (!container) return;
    try {
      const res = await fetch(API + '/events');
      const events = await res.json();
      const upcoming = events
        .filter(e => isFuture(e.date))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 2);

      if (!upcoming.length) return;
      container.replaceChildren();
      for (const ev of upcoming) {
        const card = el('div', { class: 'upcoming-card animate-on-scroll' });
        const dateDiv = el('div', { class: 'upcoming-date' });
        dateDiv.appendChild(el('span', { class: 'upcoming-month' }, dateMonth(ev.date)));
        dateDiv.appendChild(el('span', { class: 'upcoming-day' }, String(dateDay(ev.date))));
        card.appendChild(dateDiv);

        const info = el('div', { class: 'upcoming-info' });
        info.appendChild(el('h3', null, ev.title));
        const st = ev.start_time || ev.startTime;
        const et = ev.end_time || ev.endTime;
        info.appendChild(el('p', null, st + ' - ' + et + ' · ' + ev.location));
        card.appendChild(info);
        container.appendChild(card);
      }
      const link = el('a', { href: '/events/', class: 'text-link', style: 'display:inline-flex;margin-top:20px;' }, 'View All Events →');
      container.appendChild(link);
    } catch { /* keep static fallback */ }
  }

  function observeNewElements() {
    if (window.__scrollObserver) {
      document.querySelectorAll('.animate-on-scroll:not(.visible)').forEach(el => {
        window.__scrollObserver.observe(el);
      });
    }
  }

  // Run on page load
  document.addEventListener('DOMContentLoaded', async () => {
    await Promise.allSettled([
      loadEventsPage(),
      loadResourcesPage(),
      loadHomeUpcoming()
    ]);
    observeNewElements();
  });
})();
