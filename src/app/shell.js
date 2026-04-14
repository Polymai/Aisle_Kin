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

function createActionButton(action, fallbackClass) {
  const button = el('button', action.className || fallbackClass, action.label);
  button.type = 'button';
  button.addEventListener('click', action.onClick);
  return button;
}

export function createShell(mount) {
  const root = el('div', 'app-shell');
  const header = el('header', 'shell-header');
  const left = el('div', 'shell-left');
  const copy = el('div', 'shell-header-copy');
  const title = el('h1', 'shell-title');
  const subtitle = el('p', 'shell-subtitle');
  const actions = el('div', 'shell-actions');
  copy.append(title, subtitle);
  header.append(left, copy, actions);

  const main = el('main', 'shell-main');
  const nav = el('nav', 'shell-nav');
  root.append(header, main, nav);
  mount.append(root);

  return {
    setHeader({ hidden = false, title: titleText = '', subtitle: subtitleText = '', left: leftAction, right } = {}) {
      header.hidden = hidden;
      left.replaceChildren();
      actions.replaceChildren();
      title.textContent = titleText;
      subtitle.textContent = subtitleText;

      if (leftAction) {
        left.append(createActionButton(leftAction, 'icon-btn'));
      }

      if (right) {
        actions.append(createActionButton(right, 'ghost-btn'));
      }
    },

    setContent(node) {
      main.replaceChildren(node);
    },

    setNav({ visible = false, items = [], current = '' } = {}) {
      nav.hidden = !visible;
      nav.replaceChildren();

      if (!visible) {
        return;
      }

      items.forEach((item) => {
        const button = el('button', `nav-btn${current === item.key ? ' is-active' : ''}`, item.label);
        button.type = 'button';
        button.addEventListener('click', item.onClick);
        nav.append(button);
      });
    }
  };
}