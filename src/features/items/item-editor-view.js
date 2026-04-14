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

export function renderItemEditorView({
  item,
  notice,
  error,
  onSave,
  onDelete,
  onSaveFavorite,
  onSaveStaple
}) {
  const view = el('section', 'view');

  if (notice) {
    view.append(el('div', 'notice', notice));
  }
  if (error) {
    view.append(el('div', 'error', error));
  }

  if (!item) {
    view.append(el('div', 'empty', 'Item not found.'));
    return view;
  }

  const card = el('div', 'card');
  const form = el('form', 'stack');

  const nameLabel = el('label', 'label');
  nameLabel.append(el('span', '', 'Item name'));
  const nameInput = el('input', 'input');
  nameInput.name = 'name';
  nameInput.required = true;
  nameInput.value = item.name;
  nameLabel.append(nameInput);

  const topRow = el('div', 'grid-2');

  const quantityLabel = el('label', 'label');
  quantityLabel.append(el('span', '', 'Quantity'));
  const quantityInput = el('input', 'input');
  quantityInput.type = 'number';
  quantityInput.step = '0.5';
  quantityInput.min = '0';
  quantityInput.name = 'quantity';
  quantityInput.value = item.quantity;
  quantityLabel.append(quantityInput);

  const unitLabel = el('label', 'label');
  unitLabel.append(el('span', '', 'Unit'));
  const unitInput = el('input', 'input');
  unitInput.name = 'unit';
  unitInput.placeholder = 'bag, pack, lb';
  unitInput.value = item.unit || '';
  unitLabel.append(unitInput);

  topRow.append(quantityLabel, unitLabel);

  const sectionLabel = el('label', 'label');
  sectionLabel.append(el('span', '', 'Store section'));
  const sectionSelect = el('select', 'select');
  sectionSelect.name = 'section';
  SECTION_OPTIONS.forEach((option) => {
    const node = el('option');
    node.value = option.value;
    node.textContent = option.label;
    node.selected = item.section === option.value;
    sectionSelect.append(node);
  });
  sectionLabel.append(sectionSelect);

  const priorityLabel = el('label', 'label');
  priorityLabel.append(el('span', '', 'Priority'));
  const prioritySelect = el('select', 'select');
  prioritySelect.name = 'priority';
  [
    ['1', 'High'],
    ['2', 'Normal'],
    ['3', 'Low']
  ].forEach(([value, text]) => {
    const node = el('option');
    node.value = value;
    node.textContent = text;
    node.selected = String(item.priority) === value;
    prioritySelect.append(node);
  });
  priorityLabel.append(prioritySelect);

  const notesLabel = el('label', 'label');
  notesLabel.append(el('span', '', 'Notes'));
  const notesArea = el('textarea', 'textarea');
  notesArea.name = 'notes';
  notesArea.placeholder = 'Brand, ripeness, or size';
  notesArea.value = item.notes || '';
  notesLabel.append(notesArea);

  const save = el('button', 'btn btn-primary', 'Save changes');
  save.type = 'submit';

  form.append(nameLabel, topRow, sectionLabel, priorityLabel, notesLabel, save);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onSave({
      name: nameInput.value,
      quantity: quantityInput.value,
      unit: unitInput.value,
      section: sectionSelect.value,
      priority: prioritySelect.value,
      notes: notesArea.value
    });
  });

  const actions = el('div', 'grid-2');
  const favorite = el('button', 'btn btn-secondary', 'Save as favorite');
  favorite.type = 'button';
  favorite.addEventListener('click', onSaveFavorite);

  const staple = el('button', 'btn btn-secondary', 'Save as staple');
  staple.type = 'button';
  staple.addEventListener('click', onSaveStaple);

  const danger = el('button', 'btn btn-danger', 'Delete item');
  danger.type = 'button';
  danger.addEventListener('click', onDelete);

  card.append(form, actions, danger);
  actions.append(favorite, staple);
  view.append(card);

  return view;
}