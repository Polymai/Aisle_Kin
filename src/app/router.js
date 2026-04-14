function parseQuery(queryString) {
  const query = {};
  const params = new URLSearchParams(queryString || '');
  params.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

function parsePath(hash) {
  const cleaned = (hash || '#/welcome').replace(/^#/, '');
  const [path, search = ''] = cleaned.split('?');
  const parts = path.split('/').filter(Boolean);

  if (!parts.length || parts[0] === 'welcome') {
    return { name: 'welcome', params: {}, query: parseQuery(search) };
  }

  if (parts[0] === 'auth') {
    return {
      name: 'auth',
      params: { mode: parts[1] === 'login' ? 'login' : 'signup' },
      query: parseQuery(search)
    };
  }

  if (parts[0] === 'household') {
    return { name: 'household', params: {}, query: parseQuery(search) };
  }

  if (parts[0] === 'lists') {
    return { name: 'lists', params: {}, query: parseQuery(search) };
  }

  if (parts[0] === 'list' && parts[1]) {
    return { name: 'list', params: { id: parts[1] }, query: parseQuery(search) };
  }

  if (parts[0] === 'item' && parts[1]) {
    return { name: 'item', params: { id: parts[1] }, query: parseQuery(search) };
  }

  if (parts[0] === 'library') {
    return { name: 'library', params: {}, query: parseQuery(search) };
  }

  if (parts[0] === 'settings') {
    return { name: 'settings', params: {}, query: parseQuery(search) };
  }

  return { name: 'welcome', params: {}, query: {} };
}

export function createRouter({ onChange }) {
  const notify = () => onChange(parsePath(window.location.hash));

  return {
    start() {
      if (!window.location.hash) {
        window.location.hash = '#/welcome';
      }
      window.addEventListener('hashchange', notify);
      notify();
    },

    go(path) {
      const target = path.startsWith('#') ? path : `#${path}`;
      if (window.location.hash === target) {
        notify();
        return;
      }
      window.location.hash = target;
    },

    getCurrent() {
      return parsePath(window.location.hash);
    }
  };
}