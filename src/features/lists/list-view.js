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

function itemMeta(item) {
  const parts = [];
  if (item.quantity) {
    parts.push(`${item.quantity}${item.unit ? ` ${item.unit}` : ''}`);
  }
  parts.push(item.section);
  if (item.notes) {
    parts.push(item.notes);
  }
  if (item.priority === 1) {
    parts.push('High priority');
  }
  return parts.join(' • ');
}

function createItemRow(item, { onToggleItem, onEditItem, onDeleteItem }) {
  const row = el('div', `item-row${item.is_checked ? ' is-checked' : ''}`);

  const checkbox = el('input', 'item-check');
  checkbox.type = 'checkbox';
  checkbox.checked = item.is_checked;
  checkbox.addEventListener('change', () => onToggleItem(item));

  const copy = el('div');
  const name = el('p', 'item-name', item.name);
  const meta = el('p', 'item-meta', itemMeta(item));
  copy.append(name, meta);

  const actions = el('div', 'stack');
  const edit = el('button', 'ghost-btn small', 'Edit');
  edit.type = 'button';
  edit.addEventListener('click', () => onEditItem(item));
  const remove = el('button', 'ghost-btn small', 'Delete');
  remove.type = 'button';
  remove.addEventListener('click', () => onDeleteItem(item));
  actions.append(edit, remove);

  row.append(checkbox, copy, actions);
  return row;
}

export function renderListView({
  list,
  grouped,
  query,
  filter,
  hideCompleted,
  notice,
  error,
  onSearch,
  onFilterChange,
  onToggleCompleted,
  onAddItem,
  onToggleItem,
  onEditItem,
  onDeleteItem
}) {
  const view = el('section', 'view');

  if (notice) {
    view.append(el('div', 'notice', notice));
  }
  if (error) {
    view.append(el('div', 'error', error));
  }

  const quickAdd = el('div', 'card quick-add');
  quickAdd.append(el('h2', 'card-title', `Add to ${list.title}`));

  const quickForm = el('form', 'stack');
  const nameLabel = el('label', 'label');
  nameLabel.append(el('span', '', 'Item name'));
  const nameInput = el('input', 'input');
  nameInput.name = 'name';
  nameInput.placeholder = 'Tomatoes';
  nameInput.required = true;
  nameLabel.append(nameInput);

  const row = el('div', 'grid-2');
  const quantityLabel = el('label', 'label');
  quantityLabel.append(el('span', '', 'Quantity'));
  const quantityInput = el('input', 'input');
  quantityInput.name = 'quantity';
  quantityInput.type = 'number';
  quantityInput.min = '1';
  quantityInput.step = '0.5';
  quantityInput.value = '1';
  quantityLabel.append(quantityInput);

  const sectionLabel = el('label', 'label');
  sectionLabel.append(el('span', '', 'Section'));
  const sectionSelect = el('select', 'select');
  sectionSelect.name = 'section';
  SECTION_OPTIONS.forEach((option) => {
    const node = el('option');
    node.value = option.value;
    node.textContent = option.label;
    sectionSelect.append(node);
  });
  sectionLabel.append(sectionSelect);
  row.append(quantityLabel, sectionLabel);

  const submit = el('button', 'btn btn-primary', 'Add item');
  submit.type = 'submit';

  quickForm.append(nameLabel, row, submit);
  quickForm.addEventListener('submit', (event) => {
    event.preventDefault();
    onAddItem({
      name: nameInput.value,
      quantity: quantityInput.value,
      section: sectionSelect.value
    });
    nameInput.value = '';
    quantityInput.value = '1';
  });
  quickAdd.append(quickForm);

  const searchCard = el('div', 'card');
  const searchLabel = el('label', 'label');
  searchLabel.append(el('span', '', 'Search this list'));
  const searchInput = el('input', 'input');
  searchInput.value = query;
  searchInput.placeholder = 'Search items or notes';
  searchInput.addEventListener('input', () => onSearch(searchInput.value));
  searchLabel.append(searchInput);

  const chips = el('div', 'chips');
  [
    ['all', 'All'],
    ['needed', 'Needed'],
    ['high', 'High'],
    ['done', 'Done']
  ].forEach(([value, label]) => {
    const chip = el('button', `chip${filter === value ? ' is-active' : ''}`, label);
    chip.type = 'button';
    chip.addEventListener('click', () => onFilterChange(value));
    chips.append(chip);
  });

  searchCard.append(searchLabel, chips);

  view.append(quickAdd, searchCard);

  if (!grouped.groups.length && !grouped.completed.length) {
    view.append(el('div', 'empty', 'This list is clear. Add the next thing you notice.'));
    return view;
  }

  grouped.groups.forEach((group) => {
    const block = el('div', 'section-block');
    block.append(el('h3', 'section-heading', group.section));
    group.items.forEach((item) => {
      block.append(createItemRow(item, { onToggleItem, onEditItem, onDeleteItem }));
    });
    view.append(block);
  });

  const completedBlock = el('div', 'section-block');
  const completedHead = el('div', 'row-between');
  completedHead.append(
    el('h3', 'section-heading', `Completed (${grouped.completed.length})`)
  );
  const toggle = el('button', 'ghost-btn small', hideCompleted ? 'Show' : 'Hide');
  toggle.type = 'button';
  toggle.addEventListener('click', onToggleCompleted);
  completedHead.append(toggle);
  completedBlock.append(completedHead);

  if (!hideCompleted) {
    grouped.completed.forEach((item) => {
      completedBlock.append(createItemRow(item, { onToggleItem, onEditItem, onDeleteItem }));
    });
  }

  view.append(completedBlock);
  return view;
}