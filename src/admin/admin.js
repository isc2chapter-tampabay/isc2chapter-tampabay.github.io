// ISC2 Tampa Bay Chapter - Admin Panel

const API = '/api';

// ── State ──
let presentations = [];
let events = [];

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`section-${btn.dataset.section}`).classList.add('active');
    });
  });

  loadPresentations();
  loadEvents();
});

// ── Toast ──
function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = isError ? 'toast error show' : 'toast show';
  setTimeout(() => { el.className = 'toast'; }, 3000);
}

// ── Modal ──
function openModal(title, contentEl) {
  document.getElementById('modal-title').textContent = title;
  const body = document.getElementById('modal-body');
  body.replaceChildren(contentEl);
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── DOM Helpers ──
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2), v);
      } else if (k === 'className') {
        node.className = v;
      } else if (v != null && v !== false) {
        node.setAttribute(k, v);
      }
    }
  }
  for (const child of children) {
    if (child == null) continue;
    if (typeof child === 'string') {
      node.appendChild(document.createTextNode(child));
    } else if (Array.isArray(child)) {
      child.forEach(c => { if (c) node.appendChild(c); });
    } else {
      node.appendChild(child);
    }
  }
  return node;
}

function formGroup(labelText, inputEl, hint) {
  const g = el('div', { className: 'form-group' },
    el('label', null, labelText),
    inputEl
  );
  if (hint) g.appendChild(el('div', { className: 'form-hint' }, hint));
  return g;
}

function formRow(...groups) {
  return el('div', { className: 'form-row' }, ...groups);
}

// ── Presentations ──
async function loadPresentations() {
  try {
    const res = await fetch(`${API}/presentations`);
    presentations = await res.json();
    renderPresentations();
  } catch {
    document.getElementById('presentations-list').textContent = 'Failed to load.';
  }
}

function renderPresentations() {
  const list = document.getElementById('presentations-list');
  list.replaceChildren();
  if (!presentations.length) {
    list.appendChild(el('p', { className: 'loading' }, 'No presentations yet.'));
    return;
  }
  for (const p of presentations) {
    list.appendChild(
      el('div', { className: 'item-card' },
        el('div', { className: 'item-card-info' },
          el('div', { className: 'item-card-title' }, p.title),
          el('div', { className: 'item-card-meta' },
            p.speaker ? el('span', null, p.speaker) : null,
            el('span', null, p.date),
            el('span', null, p.event)
          )
        ),
        el('div', { className: 'item-card-actions' },
          el('button', { className: 'btn-secondary', onclick: () => showPresentationForm(p.id) }, 'Edit'),
          el('button', { className: 'btn-danger', onclick: () => deletePresentation(p.id) }, 'Delete')
        )
      )
    );
  }
}

function showPresentationForm(id) {
  const p = id ? presentations.find(x => x.id === id) : null;
  const title = p ? 'Edit Presentation' : 'Add Presentation';
  const tags = p ? (p.tags || []) : [];

  const titleInput = el('input', { name: 'title', required: true, value: p?.title || '' });
  const speakerInput = el('input', { name: 'speaker', value: p?.speaker || '' });
  const linkedinInput = el('input', { name: 'linkedin', type: 'url', value: p?.linkedin || '' });
  const dateInput = el('input', { name: 'date', type: 'date', required: true, value: p?.date || '' });
  const eventInput = el('input', { name: 'event', required: true, value: p?.event || '' });
  const descInput = el('textarea', { name: 'description' }, p?.description || '');
  const slidesInput = el('input', { name: 'slides', value: p?.slides || '' });
  const videoInput = el('input', { name: 'video', type: 'url', value: p?.video || '' });
  const imageHidden = el('input', { type: 'hidden', name: 'image', value: p?.image || '' });

  const slidesUpload = el('input', { type: 'file', accept: '.pdf,.pptx,.ppt,.key' });
  slidesUpload.addEventListener('change', () => uploadFile(slidesUpload, 'slides', slidesInput));

  const headArea = el('div', { className: 'file-upload-area' });
  if (p?.image) {
    headArea.appendChild(el('img', { className: 'file-upload-preview', src: p.image, alt: '' }));
  }
  const headUpload = el('input', { type: 'file', accept: 'image/*' });
  headUpload.addEventListener('change', () => uploadFile(headUpload, 'headshots', imageHidden, headArea));
  headArea.appendChild(headUpload);
  headArea.appendChild(imageHidden);

  // Tags
  const tagsContainer = el('div', { className: 'tags-container' });
  const tagsInput = el('input', { className: 'tags-input', placeholder: 'Type and press Enter' });
  tagsInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const val = tagsInput.value.trim().replace(/,/g, '');
    if (!val) return;
    tagsContainer.insertBefore(makeTagPill(val), tagsInput);
    tagsInput.value = '';
  });
  tags.forEach(t => tagsContainer.appendChild(makeTagPill(t)));
  tagsContainer.appendChild(tagsInput);
  tagsContainer.addEventListener('click', () => tagsInput.focus());

  const form = el('form', null,
    formGroup('Title *', titleInput),
    formRow(
      formGroup('Speaker', speakerInput),
      formGroup('LinkedIn URL', linkedinInput)
    ),
    formRow(
      formGroup('Date *', dateInput),
      formGroup('Event Name *', eventInput)
    ),
    formGroup('Description', descInput),
    formGroup('Slides URL or Upload', slidesInput, 'Paste a Google Slides link or upload a file below'),
    el('div', { className: 'form-group' },
      el('div', { className: 'file-upload-area', style: 'margin-top:4px' }, slidesUpload)
    ),
    formGroup('Video URL', videoInput),
    el('div', { className: 'form-group' },
      el('label', null, 'Speaker Headshot'),
      headArea
    ),
    el('div', { className: 'form-group' },
      el('label', null, 'Tags'),
      tagsContainer
    ),
    el('div', { className: 'form-actions' },
      el('button', { type: 'button', className: 'btn-secondary', onclick: () => closeModal() }, 'Cancel'),
      el('button', { type: 'submit', className: 'btn-primary' }, p ? 'Save Changes' : 'Add Presentation')
    )
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formTags = Array.from(tagsContainer.querySelectorAll('.tag-pill'))
      .map(pill => pill.firstChild.textContent.trim());
    const body = {
      title: titleInput.value,
      speaker: speakerInput.value,
      linkedin: linkedinInput.value || null,
      date: dateInput.value,
      event: eventInput.value,
      description: descInput.value || null,
      slides: slidesInput.value || null,
      video: videoInput.value || null,
      image: imageHidden.value || null,
      tags: formTags
    };
    if (id) body.id = id;

    try {
      const res = await fetch(`${API}/presentations`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Save failed');
      closeModal();
      toast(id ? 'Presentation updated' : 'Presentation added');
      loadPresentations();
    } catch {
      toast('Error saving presentation', true);
    }
  });

  openModal(title, form);
}

async function deletePresentation(id) {
  if (!confirm('Delete this presentation?')) return;
  try {
    await fetch(`${API}/presentations?id=${id}`, { method: 'DELETE' });
    toast('Presentation deleted');
    loadPresentations();
  } catch {
    toast('Error deleting', true);
  }
}

// ── Events ──
async function loadEvents() {
  try {
    const res = await fetch(`${API}/events`);
    events = await res.json();
    renderEvents();
  } catch {
    document.getElementById('events-list').textContent = 'Failed to load.';
  }
}

function renderEvents() {
  const list = document.getElementById('events-list');
  list.replaceChildren();
  if (!events.length) {
    list.appendChild(el('p', { className: 'loading' }, 'No events yet.'));
    return;
  }
  for (const ev of events) {
    const meta = [
      ev.end_date ? `${ev.date} to ${ev.end_date}` : ev.date,
      `${ev.start_time} - ${ev.end_time}`,
      ev.type
    ];
    list.appendChild(
      el('div', { className: 'item-card' },
        el('div', { className: 'item-card-info' },
          el('div', { className: 'item-card-title' }, ev.title),
          el('div', { className: 'item-card-meta' },
            ...meta.map(m => el('span', null, m))
          )
        ),
        el('div', { className: 'item-card-actions' },
          el('button', { className: 'btn-secondary', onclick: () => showEventForm(ev.id) }, 'Edit'),
          el('button', { className: 'btn-danger', onclick: () => deleteEvent(ev.id) }, 'Delete')
        )
      )
    );
  }
}

function showEventForm(id) {
  const ev = id ? events.find(x => x.id === id) : null;
  const formTitle = ev ? 'Edit Event' : 'Add Event';

  const titleInput = el('input', { name: 'title', required: true, value: ev?.title || '' });
  const dateInput = el('input', { name: 'date', type: 'date', required: true, value: ev?.date || '' });
  const endDateInput = el('input', { name: 'endDate', type: 'date', value: ev?.end_date || '' });
  const startTimeInput = el('input', { name: 'startTime', required: true, value: ev?.start_time || '', placeholder: '10:00 AM' });
  const endTimeInput = el('input', { name: 'endTime', required: true, value: ev?.end_time || '', placeholder: '2:00 PM' });
  const locationInput = el('input', { name: 'location', required: true, value: ev?.location || '' });
  const descInput = el('textarea', { name: 'description' }, ev?.description || '');
  const urlInput = el('input', { name: 'url', type: 'url', value: ev?.url || '' });

  const typeSelect = el('select', { name: 'type', required: true },
    el('option', { value: 'chapter', selected: ev?.type === 'chapter' || !ev }, 'Chapter'),
    el('option', { value: 'community', selected: ev?.type === 'community' }, 'Community'),
    el('option', { value: 'holiday', selected: ev?.type === 'holiday' }, 'Holiday')
  );

  const form = el('form', null,
    formGroup('Title *', titleInput),
    formRow(
      formGroup('Start Date *', dateInput),
      formGroup('End Date', endDateInput, 'For multi-day events only')
    ),
    formRow(
      formGroup('Start Time *', startTimeInput),
      formGroup('End Time *', endTimeInput)
    ),
    formGroup('Location *', locationInput),
    formGroup('Type *', typeSelect),
    formGroup('Description', descInput),
    formGroup('URL', urlInput, 'Registration link, event website, etc.'),
    el('div', { className: 'form-actions' },
      el('button', { type: 'button', className: 'btn-secondary', onclick: () => closeModal() }, 'Cancel'),
      el('button', { type: 'submit', className: 'btn-primary' }, ev ? 'Save Changes' : 'Add Event')
    )
  );

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      title: titleInput.value,
      date: dateInput.value,
      endDate: endDateInput.value || null,
      startTime: startTimeInput.value,
      endTime: endTimeInput.value,
      location: locationInput.value,
      type: typeSelect.value,
      description: descInput.value || null,
      url: urlInput.value || null,
      image: null
    };
    if (id) body.id = id;

    try {
      const res = await fetch(`${API}/events`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Save failed');
      closeModal();
      toast(id ? 'Event updated' : 'Event added');
      loadEvents();
    } catch {
      toast('Error saving event', true);
    }
  });

  openModal(formTitle, form);
}

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  try {
    await fetch(`${API}/events?id=${id}`, { method: 'DELETE' });
    toast('Event deleted');
    loadEvents();
  } catch {
    toast('Error deleting', true);
  }
}

// ── File Upload ──
async function uploadFile(input, prefix, targetInput, previewContainer) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('prefix', prefix);

  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();

    targetInput.value = data.url;

    if (previewContainer && data.url) {
      let preview = previewContainer.querySelector('.file-upload-preview');
      if (!preview) {
        preview = el('img', { className: 'file-upload-preview', alt: '' });
        previewContainer.prepend(preview);
      }
      preview.src = data.url;
    }

    toast('File uploaded');
  } catch {
    toast('Upload failed', true);
  }
}

// ── Publish ──
async function publishSite() {
  const btn = document.getElementById('publish-btn');
  if (!confirm('Rebuild and publish the live site with your latest changes?')) return;
  btn.disabled = true;
  btn.textContent = 'Publishing...';
  try {
    const res = await fetch(`${API}/rebuild`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Rebuild failed');
    toast('Site rebuild triggered. Changes will be live in about 30 seconds.');
  } catch (err) {
    toast(err.message || 'Failed to trigger rebuild', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish Site';
  }
}

// ── Tags ──
function makeTagPill(text) {
  const removeBtn = el('button', { type: 'button' }, '\u00d7');
  removeBtn.addEventListener('click', () => pill.remove());
  const pill = el('span', { className: 'tag-pill' }, text, removeBtn);
  return pill;
}
