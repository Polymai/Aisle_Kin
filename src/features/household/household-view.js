function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text) {
    node.textContent = text;
  }
  return node;
}

export function renderHouseholdView({ notice, error, onCreate, onJoin }) {
  const view = el('section', 'view');

  if (notice) {
    view.append(el('div', 'notice', notice));
  }
  if (error) {
    view.append(el('div', 'error', error));
  }

  const createCard = el('div', 'card');
  createCard.append(
    el('h2', 'card-title', 'Create a household'),
    el('p', 'card-copy', 'Start shared lists, invites, and weekly staples in one place.')
  );

  const createForm = el('form', 'stack');
  const createLabel = el('label', 'label');
  createLabel.append(el('span', '', 'Household name'));
  const createInput = el('input', 'input');
  createInput.name = 'name';
  createInput.required = true;
  createInput.placeholder = 'Rivera home';
  createLabel.append(createInput);
  const createButton = el('button', 'btn btn-primary', 'Create household');
  createButton.type = 'submit';
  createForm.append(createLabel, createButton);
  createForm.addEventListener('submit', (event) => {
    event.preventDefault();
    onCreate(createInput.value);
  });
  createCard.append(createForm);

  const joinCard = el('div', 'card');
  joinCard.append(
    el('h2', 'card-title', 'Join with a code'),
    el('p', 'card-copy', 'Got an invite from someone at home? Enter it here.')
  );

  const joinForm = el('form', 'stack');
  const joinLabel = el('label', 'label');
  joinLabel.append(el('span', '', 'Invite code'));
  const joinInput = el('input', 'input');
  joinInput.name = 'code';
  joinInput.required = true;
  joinInput.placeholder = 'AB4K9P';
  joinInput.autocapitalize = 'characters';
  joinLabel.append(joinInput);
  const joinButton = el('button', 'btn btn-secondary', 'Join household');
  joinButton.type = 'submit';
  joinForm.append(joinLabel, joinButton);
  joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    onJoin(joinInput.value);
  });
  joinCard.append(joinForm);

  view.append(createCard, joinCard);
  return view;
}