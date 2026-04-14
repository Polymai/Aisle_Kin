import { SECTION_OPTIONS } from '../../data/sections.js';

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

function renderEntry(entry, label, onAdd, onDelete) {
  const card = el('div', 'card');
  card.append(
    el('h3', 'card-title', entry.name),
    el(
      'p',
      'card-copy',
      `${entry.default_quantity || entry.quantity || 1}${entry.default_unit || entry.unit ? ` ${entry.default_unit || entry.unit}` : ''} • ${entry.default_section || entry.section || 'Other'}`
    )
  );

  const actions = el('div', 'grid-2');
  const add = el('button', 'btn btn-primary', label);
  add.type = 'button';
  add.addEventListener('click', () => onAdd(entry));
  actions.append(add);

  if (entry.id && entry.kind) {
    const remove = el('button', 'btn btn-secondary', 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', () => onDelete(entry.id));
    actions.append(remove);
  }

  card.append(actions);
  return card;
}

export function renderLibraryView({
  collections,
  targetListName,
  notice,
  error,
  onAddEntry,
  onCreateStaple,
  onDeleteEntry
}) {
  const view = el('section', 'view');

  if (notice) {
    view.append(el('div', 'notice', notice));
  }
  if (error) {
    view.append(el('div', 'error', error));
  }

  const intro = el('div', 'card card-soft');
  intro.append(
    el('h2', 'card-title', 'Reusable grocery picks'),
    el(
      'p',
      'card-copy',
      targetListName
        ? `Tap any item to drop it into ${targetListName}.`
        : 'Create a list to start adding from favorites, staples, and recents.'
    )
  );
  view.append(intro);

  const createCard = el('div', 'card');
  createCard.append(el('h3', 'card-title', 'Add a recurring staple'));

  const form = el('form', 'stack');
  const nameLabel = el('label', 'label');
  nameLabel.append(el('span', '', 'Staple name'));
  const nameInput = el('input', 'input');
  nameInput.required = true;
  nameInput.placeholder = 'Paper towels';
  nameLabel.append(nameInput);

  const row = el('div', 'grid-2');
  const quantityLabel = el('label', 'label');
  quantityLabel.append(el('span', '', 'Quantity'));
  const quantityInput = el('input', 'input');
  quantityInput.type = 'number';
  quantityInput.step = '0.5';
  quantityInput.min = '1';
  quantityInput.value = '1';
  quantityLabel.append(quantityInput);

  const sectionLabel = el('label', 'label');
  sectionLabel.append(el('span', '', 'Section'));
  const sectionSelect = el('select', 'select');
  SECTION_OPTIONS.forEach((option) => {
    const node = el('option');
    node.value = option.value;
    node.textContent = option.label;
    sectionSelect.append(node);
  });
  sectionLabel.append(sectionSelect);

  row.append(quantityLabel, sectionLabel);
  const submit = el('button', 'btn btn-secondary', 'Save staple');
  submit.type = 'submit';
  form.append(nameLabel, row, submit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onCreateStaple({
      name: nameInput.value,
      quantity: quantityInput.value,
      section: sectionSelect.value,
      priority: 2
    });
    nameInput.value = '';
    quantityInput.value = '1';
  });
  createCard.append(form);
  view.append(createCard);

  const blocks = [
    ['Favorites', collections?.favorites || [], 'Add favorite'],
    ['Staples', collections?.staples || [], 'Add staple'],
    ['Recent items', collections?.recents || [], 'Add again']
  ];

  blocks.forEach(([title, items, label]) => {
    const block = el('div', 'section-block');
    block.append(el('h3', 'section-heading', title));
    if (!items.length) {
      block.append(el('div', 'empty', `No ${title.toLowerCase()} yet.`));
    } else {
      items.forEach((entry) => {
        block.append(renderEntry(entry, label, onAddEntry, onDeleteEntry));
      });
    }
    view.append(block);
  });

  return view;
}