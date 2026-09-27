export function initPrototype() {
const screens = [...document.querySelectorAll('.screen')];
const byId = (id) => document.getElementById(id);
let activeBoard = 'demo';
const pollVotes = new WeakMap();
let toastTimer;

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
  const activeScreen = screens.find((screen) => screen.id === id);
  activeScreen?.scrollTo({ top: 0, behavior: 'smooth' });
}

// Use one delegated handler so React's nested markup and SVG/icon clicks cannot
// strand navigation on an individual child element.
document.addEventListener('click', (event) => {
  const button = event.target.closest?.('[data-go]');
  if (!button) return;
  event.preventDefault();
  showScreen(button.dataset.go);
}, true);

function showToast(message) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  showScreen(button.dataset.go);
}));

document.querySelectorAll('[data-open-board]').forEach((card) => card.addEventListener('click', () => {
  openBoard(card.dataset.openBoard);
}));

function openBoard(type) {
  activeBoard = type;
  const demo = type === 'demo';
  byId('demo-components').style.display = demo ? '' : 'none';
  byId('empty-state').classList.toggle('visible', !demo);
  document.querySelector('.project-menu button').innerHTML = `${demo ? 'CS 410 Group Project' : 'Untitled workspace'} <span>⌄</span>`;
  byId('project-subtitle').textContent = demo ? 'Semester project · Fall 2026' : 'A fresh space for your next big idea';
  byId('component-drawer').classList.remove('open');
  byId('chat-panel').classList.remove('open');
  byId('menu-handle').textContent = '›';
  byId('sticky-color-picker').classList.remove('open');
  showScreen('board-screen');
}

byId('new-workspace').addEventListener('click', () => openBoard('empty'));
byId('menu-handle').addEventListener('click', () => {
  const isOpen = byId('component-drawer').classList.toggle('open');
  byId('menu-handle').textContent = isOpen ? '‹' : '›';
});
byId('close-drawer').addEventListener('click', () => {
  byId('component-drawer').classList.remove('open');
  byId('menu-handle').textContent = '›';
  byId('sticky-color-picker').classList.remove('open');
});
byId('empty-add').addEventListener('click', () => {
  byId('component-drawer').classList.add('open');
  byId('menu-handle').textContent = '‹';
});

document.querySelectorAll('.component-options [data-component]').forEach((option) => option.addEventListener('click', () => {
  const kind = option.dataset.component;
  if (kind === 'Sticky note') {
    byId('sticky-color-picker').classList.add('open');
    return;
  }
  if (['File', 'Deadline', 'Quick poll', 'GitHub', 'Vercel'].includes(kind)) {
    openConfig(kind);
    return;
  }
  if (activeBoard === 'empty') {
    byId('empty-state').classList.remove('visible');
    byId('demo-components').style.display = '';
    byId('demo-components').replaceChildren();
    activeBoard = 'custom';
  }
  addComponent(kind);
}));

function closeConfig() {
  byId('config-modal')?.remove();
}

function openConfig(kind) {
  closeConfig();
  byId('sticky-color-picker')?.classList.remove('open');
  const copy = {
    File: ['Add a file', 'Choose an icon and give your shared file a name.', '<div class="config-field"><label>File name</label><input id="config-file-name" value="Project_Proposal.pdf" /></div><div class="config-field"><label>File type</label><div class="file-type-options"><button type="button" class="file-type selected" data-file-type="PDF">PDF</button><button type="button" class="file-type" data-file-type="DOCX">Word</button><button type="button" class="file-type" data-file-type="MP4">MP4</button><button type="button" class="file-type" data-file-type="TXT">Text</button></div></div><div class="config-field"><label>Upload (demo only)</label><input id="config-file" type="file" /></div>'],
    Deadline: ['Add a deadline', 'Keep one important date visible for the whole team.', '<div class="config-field"><label>What is due?</label><input id="config-deadline-title" value="Final presentation" /></div><div class="config-field"><label>Date</label><input id="config-deadline-date" type="date" /></div>'],
    'Quick poll': ['Create a quick poll', 'Ask one clear question and give your team a few choices.', '<div class="config-field"><label>Question</label><input id="config-poll-question" placeholder="Which design should we use?" /></div><div class="config-field"><label>Options</label><input id="config-poll-options" value="Option A, Option B, Option C" /></div>'],
    GitHub: ['Connect GitHub', 'Paste a repository link. Authorization is simulated for this prototype.', '<div class="config-field"><label>Repository link</label><input id="config-github-link" placeholder="https://github.com/your-team/project" /></div>'],
    Vercel: ['Connect Vercel', 'Paste a project link. Authorization is simulated for this prototype.', '<div class="config-field"><label>Project link</label><input id="config-vercel-link" placeholder="https://vercel.com/your-team/project" /></div>']
  }[kind];
  const modal = document.createElement('div');
  modal.id = 'config-modal';
  modal.className = 'config-modal';
  modal.innerHTML = `<div class="config-dialog"><button type="button" class="config-close" aria-label="Close setup">×</button><div class="eyebrow">MAKE IT REAL</div><h3>${copy[0]}</h3><p>${copy[1]}</p><form id="config-form">${copy[2]}<div class="config-actions"><button type="button" class="config-cancel">Cancel</button><button class="config-submit">${kind === 'File' ? 'Add file' : kind === 'Quick poll' ? 'Create poll' : kind === 'Deadline' ? 'Add deadline' : 'Authorize'} <span>→</span></button></div></form></div>`;
  document.body.append(modal);
  modal.querySelector('.config-close').addEventListener('click', closeConfig);
  modal.querySelector('.config-cancel').addEventListener('click', closeConfig);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeConfig(); });
  modal.querySelectorAll('[data-file-type]').forEach((type) => type.addEventListener('click', () => {
    modal.querySelectorAll('[data-file-type]').forEach((item) => item.classList.remove('selected'));
    type.classList.add('selected');
  }));
  modal.querySelector('#config-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (kind === 'File') {
      const fileName = modal.querySelector('#config-file-name').value.trim() || 'New_project_file';
      const type = modal.querySelector('.file-type.selected')?.dataset.fileType || 'FILE';
      addComponent('File', 'yellow', `${fileName} · ${type}`);
    } else if (kind === 'Quick poll') {
      const question = modal.querySelector('#config-poll-question').value.trim() || 'Which design should we use?';
      const options = modal.querySelector('#config-poll-options').value.trim() || 'Option A, Option B, Option C';
      addComponent('Quick poll', 'yellow', `${question}||${options}`);
    } else if (kind === 'Deadline') {
      const title = modal.querySelector('#config-deadline-title').value.trim() || 'New deadline';
      const dateValue = modal.querySelector('#config-deadline-date').value;
      const dateLabel = dateValue ? new Date(`${dateValue}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      addComponent('Deadline', 'yellow', `${title}||${dateLabel}`);
    } else {
      const link = modal.querySelector(`#config-${kind.toLowerCase()}-link`)?.value.trim();
      addComponent(kind, 'yellow', link || `${kind} authorized · demo data ready`);
      showToast(`${kind} authorized for this demo`);
    }
    closeConfig();
  });
}

function addComponent(kind, stickyColor = 'yellow', customLabel = '') {
  const board = byId('demo-components');
  const count = board.children.length;
  const pos = { '--x': `${12 + (count % 3) * 25}%`, '--y': `${12 + (Math.floor(count / 3) % 3) * 25}%`, '--rotate': `${count % 2 ? 3 : -3}deg`, '--delay': '0s' };
  let card = document.createElement('article');

  if (kind === 'Sticky note') {
    card.className = `component sticky ${stickyColor}`;
    card.innerHTML = '<span class="pin red-pin"></span><p contenteditable="true" aria-label="Edit sticky note">A new idea!<br>Click to edit ✨</p>';
  } else if (kind === 'File') {
    const [rawName, rawType] = customLabel.split('·').map((value) => value.trim());
    const fileName = rawName || 'Project_file.pdf';
    const fileType = rawType || 'PDF';
    card.className = 'component file-card added-file-card';
    card.innerHTML = `<div class="pdf-icon file-icon-${fileType.toLowerCase()}"><span>${fileType}</span></div><span class="file-name" contenteditable="true" aria-label="Edit file name">${fileName}</span><button class="remove-added file-remove" aria-label="Remove file">×</button>`;
  } else if (kind === 'GitHub') {
    card.className = 'component card github-card added-integration-card';
    const link = customLabel || 'https://github.com/your-team/project';
    card.innerHTML = `<div class="card-head"><div class="service-icon github-icon">◉</div><b>GitHub</b><span class="connected">Connected</span><button class="collapse-card remove-added" aria-label="Remove GitHub">×</button></div><div class="card-section"><b>Repository</b><a class="demo-link editable-board-text" href="${link.startsWith('http') ? link : '#'}" target="_blank" rel="noreferrer">${link}</a></div><div class="card-section commits"><b>Recent Commits</b><div>＋ &nbsp; Fix login bug <small>by Alex · just now</small></div><div>＋ &nbsp; Update UI components <small>by Jamie · 2 hours ago</small></div></div>`;
  } else if (kind === 'Vercel') {
    card.className = 'component card vercel-card added-integration-card';
    const link = customLabel || 'https://project-alpha.vercel.app';
    card.innerHTML = `<div class="card-head"><div class="service-icon vercel-icon">▲</div><b>Vercel</b><span class="connected">Connected</span><button class="collapse-card remove-added" aria-label="Remove Vercel">×</button></div><div class="card-section"><b>Production Deployment</b><div class="deploy-row success"><span>✓</span>Successful <small>just now</small></div><a class="demo-link editable-board-text" href="${link.startsWith('http') ? link : '#'}" target="_blank" rel="noreferrer">${link}</a></div><div class="card-section deploy-list"><b>Recent Deployments</b><div class="deploy-row success"><span>✓</span>Deployed <small>just now</small></div></div>`;
  } else if (kind === 'Deadline') {
    card.className = 'component card deadline-card added-deadline-card';
    const [title, dateLabel] = (customLabel || 'New deadline').split('||');
    card.innerHTML = `<div class="card-head"><span class="calendar-icon">▣</span><b>Upcoming Deadlines</b><button class="collapse-card remove-added" aria-label="Remove deadline">×</button></div><div class="deadline-list"><div><i class="dot red"></i><span class="editable-board-text" contenteditable="true">${title || 'New deadline'}</span><time>${dateLabel || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time></div></div>`;
  } else if (kind === 'Quick poll') {
    card.className = 'component card poll-card added-poll-card';
    const [question, optionText] = (customLabel || 'Which design should we use?||Option A, Option B, Option C').split('||');
    const options = (optionText || 'Option A, Option B, Option C').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3);
    while (options.length < 3) options.push(`Option ${String.fromCharCode(65 + options.length)}`);
    const widths = [78, 48, 24];
    card.innerHTML = `<div class="card-head"><span class="poll-icon">▥</span><b>Quick Poll</b><span class="poll-live">● LIVE</span><button class="collapse-card remove-added" aria-label="Remove poll">×</button></div><p class="poll-question editable-board-text" contenteditable="true">${question || 'Which design should we use?'}</p><div class="poll-options">${options.map((option, index) => `<button data-vote="${String.fromCharCode(65 + index)}"><span contenteditable="true" class="editable-board-text">${option}</span><span class="bar-track"><i style="width:${widths[index]}%"></i></span><b class="votes">0 votes</b></button>`).join('')}</div><small class="poll-footnote">Tap an option to cast your vote</small>`;
  } else if (kind === 'Checklist') {
    card.className = 'component card checklist-card added-checklist-card';
    card.innerHTML = `<div class="card-head"><span class="check-icon">✓</span><b>Checklist</b><span class="task-progress">0 / 1</span><button class="collapse-card remove-added" aria-label="Remove checklist">×</button></div><div class="check-items"><label><input type="checkbox"><span contenteditable="true">Add your first task</span></label></div><button class="add-check-item">＋ &nbsp;Add item</button>`;
  } else {
    card.className = 'component card added-card';
    const icon = ({ Notes: '▤' }[kind] || '✦');
    card.innerHTML = `<div class="card-head"><span class="option-icon">${icon}</span><b>${kind}</b><button class="collapse-card remove-added" aria-label="Remove ${kind}">×</button></div><p class="editable-board-text" contenteditable="true">${customLabel || 'A new shared component'}</p>`;
  }

  Object.entries(pos).forEach(([key, value]) => card.style.setProperty(key, value));
  card.dataset.draggable = '';
  board.append(card);
  card.querySelectorAll('[contenteditable="true"]').forEach((element) => element.classList.add('editable-board-text'));
  makeDraggable(card);
  showToast(`${kind} added to your board`);
  if (activeBoard === 'custom') document.querySelector('.project-menu button').innerHTML = `Untitled workspace <span>⌄</span>`;
}

// Board pieces can be freely repositioned while remaining within the cork area.
function makeDraggable(card) {
  let startX, startY, startLeft, startTop;
  card.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button,input,a,[contenteditable="true"]')) return;
    if (event.button !== 0) return;
    const board = byId('cork-board');
    const rect = board.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = cardRect.left - rect.left + board.scrollLeft;
    startTop = cardRect.top - rect.top + board.scrollTop;
    card.classList.add('dragging');
    card.setPointerCapture(event.pointerId);
    const move = (e) => {
      const desiredTop = Math.max(0, startTop + e.clientY - startY);
      const neededHeight = desiredTop + card.offsetHeight + 32;
      if (neededHeight > board.clientHeight) {
        board.style.height = `${neededHeight}px`;
      }
      const left = Math.max(0, Math.min(board.clientWidth - card.offsetWidth, startLeft + e.clientX - startX));
      const top = desiredTop;
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.style.setProperty('--drag-top', `${top}px`);
    };
    const end = () => {
      card.classList.remove('dragging');
      card.classList.add('moved');
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerup', end);
      card.removeEventListener('pointercancel', end);
    };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
  });
}

document.querySelectorAll('[data-draggable]').forEach(makeDraggable);
document.querySelectorAll('[data-sticky-color]').forEach((swatch) => swatch.addEventListener('click', () => {
  const tone = swatch.dataset.stickyColor;
  byId('sticky-color-picker').classList.remove('open');
  if (activeBoard === 'empty') {
    byId('empty-state').classList.remove('visible');
    byId('demo-components').style.display = '';
    byId('demo-components').replaceChildren();
    activeBoard = 'custom';
  }
  addComponent('Sticky note', tone);
}));
document.addEventListener('click', (event) => {
  const remove = event.target.closest('.remove-added');
  if (remove) remove.closest('.component')?.remove();
});

// The palette is intentionally transient: clicking another board control or
// closing the drawer dismisses it so it never lingers over the canvas.
document.addEventListener('click', (event) => {
  const picker = byId('sticky-color-picker');
  if (!picker?.classList.contains('open')) return;
  if (!event.target.closest('.sticky-color-picker') && !event.target.closest('[data-component="Sticky note"]')) picker.classList.remove('open');
});

// Text already on the sample board is editable for the demo. Content stays
// local to the prototype, but the focus treatment makes the affordance clear.
document.querySelectorAll('.sticky p,.notes-card p,.poll-question,.deadline-list span,.file-name').forEach((element) => {
  element.contentEditable = 'true';
  element.classList.add('editable-board-text');
  element.setAttribute('title', 'Click to edit');
});

document.querySelectorAll('.check-items input').forEach((input) => input.addEventListener('change', () => {
  const all = [...document.querySelectorAll('.check-items input')];
  document.querySelector('.task-progress').textContent = `${all.filter((item) => item.checked).length} / ${all.length}`;
}));
byId('dismiss-tip').addEventListener('click', (event) => event.currentTarget.closest('.home-tip').remove());
document.querySelector('.checklist-card .add-check-item').addEventListener('click', (event) => {
  const button = event.currentTarget;
  if (button.previousElementSibling?.classList.contains('inline-check-input')) return;
  const row = document.createElement('div');
  row.className = 'inline-check-input';
  row.innerHTML = '<input placeholder="Add a task…" aria-label="New checklist task" /><button type="button" aria-label="Save checklist task">＋</button>';
  button.before(row);
  const input = row.querySelector('input');
  const save = () => {
    const text = input.value.trim();
    if (!text) return input.focus();
    const label = document.createElement('label');
    label.innerHTML = '<input type="checkbox"><span></span>';
    label.querySelector('span').textContent = text;
    document.querySelector('.check-items').append(label);
    input.value = '';
    row.remove();
    label.querySelector('input').addEventListener('change', () => {
      const all = [...document.querySelectorAll('.check-items input')];
      document.querySelector('.task-progress').textContent = `${all.filter((item) => item.checked).length} / ${all.length}`;
    });
    const all = document.querySelectorAll('.check-items input').length;
    document.querySelector('.task-progress').textContent = `${[...document.querySelectorAll('.check-items input')].filter((item) => item.checked).length} / ${all}`;
  };
  row.querySelector('button').addEventListener('click', save);
  input.addEventListener('keydown', (keyEvent) => { if (keyEvent.key === 'Enter') { keyEvent.preventDefault(); save(); } });
  input.focus();
});

function votePoll(button) {
  const poll = button.closest('.poll-options');
  if (!poll) return;
  const buttons = [...poll.querySelectorAll('[data-vote]')];
  const counts = buttons.map((item) => Number.parseInt(item.querySelector('.votes').textContent, 10) || 0);
  const previous = pollVotes.get(poll);
  if (previous !== undefined) counts[previous] = Math.max(0, counts[previous] - 1);
  const index = buttons.indexOf(button);
  counts[index]++;
  pollVotes.set(poll, index);
  const max = Math.max(...counts);
  buttons.forEach((item, i) => {
    item.querySelector('.votes').textContent = `${counts[i]} ${counts[i] === 1 ? 'vote' : 'votes'}`;
    item.querySelector('.bar-track i').style.width = `${max ? Math.max(12, counts[i] / max * 100) : 0}%`;
    item.classList.toggle('voted', i === index);
  });
  showToast(`Your vote for Option ${button.dataset.vote} is in!`);
}
document.addEventListener('click', (event) => {
  const button = event.target.closest?.('[data-vote]');
  if (button) votePoll(button);
});

byId('chat-fab').addEventListener('click', () => {
  byId('chat-panel').classList.add('open');
  byId('chat-fab').classList.add('chat-open');
  byId('chat-input').focus();
});
byId('close-chat').addEventListener('click', () => {
  byId('chat-panel').classList.remove('open');
  byId('chat-fab').classList.remove('chat-open');
});
byId('chat-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = byId('chat-input');
  const value = input.value.trim();
  if (!value) return;
  const message = document.createElement('div');
  message.className = 'chat-message mine';
  const avatar = document.createElement('span');
  avatar.className = 'avatar user-avatar';
  avatar.textContent = 'JD';
  const content = document.createElement('div');
  content.innerHTML = '<b>You <small>now</small></b>';
  const paragraph = document.createElement('p');
  paragraph.textContent = value;
  content.append(paragraph);
  message.append(avatar, content);
  document.querySelector('.chat-messages').append(message);
  input.value = '';
  document.querySelector('.chat-messages').scrollTop = document.querySelector('.chat-messages').scrollHeight;
});

byId('invite-button').addEventListener('click', () => byId('modal-backdrop').classList.add('open'));
byId('close-modal').addEventListener('click', () => byId('modal-backdrop').classList.remove('open'));
byId('modal-backdrop').addEventListener('click', (event) => {
  if (event.target === byId('modal-backdrop')) byId('modal-backdrop').classList.remove('open');
});
byId('send-invite').addEventListener('click', () => {
  const email = byId('invite-email').value.trim();
  if (!email || !email.includes('@')) {
    byId('invite-email').focus();
    byId('invite-email').setCustomValidity('Enter a valid email address');
    byId('invite-email').reportValidity();
    return;
  }
  byId('invite-email').setCustomValidity('');
  byId('modal-backdrop').classList.remove('open');
  byId('invite-email').value = '';
  showToast(`Invite ready for ${email}`);
});
byId('notifications').addEventListener('click', () => byId('notification-popover').classList.toggle('show'));
document.addEventListener('click', (event) => {
  if (!event.target.closest('#notifications') && !event.target.closest('#notification-popover')) byId('notification-popover').classList.remove('show');
});
document.querySelector('.collapse-card[aria-label="Collapse deadlines"]').addEventListener('click', (event) => {
  const list = event.currentTarget.closest('.deadline-card').querySelector('.deadline-list');
  list.hidden = !list.hidden;
  event.currentTarget.textContent = list.hidden ? '›' : '⌄';
});
document.querySelector('.tiny-open').addEventListener('click', () => showToast('Pull request preview · #42 Add authentication flow'));
document.querySelector('.external-link').addEventListener('click', () => showToast('Figma preview opened in this workspace'));
document.querySelector('.demo-link').addEventListener('click', (event) => {
  event.preventDefault();
  showToast('Production deployment · Successful');
});
document.querySelector('.project-menu button').addEventListener('click', () => showToast('Workspace settings are coming soon'));
byId('sort-workspaces').addEventListener('click', (event) => {
  event.currentTarget.innerHTML = event.currentTarget.textContent.includes('Recently') ? 'Name A–Z <span>⌄</span>' : 'Recently opened <span>⌄</span>';
  const grid = document.querySelector('.workspace-grid');
  [...grid.children].reverse().forEach((card) => grid.append(card));
});

// Keep the two explicit escape controls independent from delegated navigation.
const returnHome = (event) => {
  event.preventDefault();
  event.stopPropagation();
  showScreen('welcome');
};
document.querySelector('.home-board-button')?.addEventListener('click', returnHome);
document.querySelector('.board-logo')?.addEventListener('click', returnHome);

showScreen('welcome');
}

