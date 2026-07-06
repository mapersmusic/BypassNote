module.exports = {
  id: 'basic-module',
  name: 'Module de base',
  description: 'Template minimal pour créer un nouveau module.',
  version: '1.0.0',
  createPage({ state, getVisibleItems, helpers }) {
    const tricks = getVisibleItems('tricks');
    return `
      <div style="padding:24px;font-family:IBM Plex Sans,system-ui,sans-serif;color:#e4e4f0;background:#0f0f11;min-height:100vh">
        <h1>Module de base</h1>
        <p>Ce template peut être copié pour créer un nouveau module.</p>
        <p>Tricks visibles : ${tricks.length}</p>
        <button style="padding:10px 16px;border:none;border-radius:8px;background:#6c63ff;color:#fff;cursor:pointer" onclick="window.close()">Fermer</button>
      </div>`;
  }
};
