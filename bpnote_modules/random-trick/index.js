module.exports = {
  id: 'random-trick',
  name: 'Random Trick',
  description: 'Choisit un trick au hasard parmi les tricks visibles.',
  version: '0.1.0',
  createPage({ state, getVisibleItems }) {
    const tricks = getVisibleItems('tricks');
    if (!tricks.length) {
      return `
        <div style="padding:16px;font-family:IBM Plex Sans,system-ui,sans-serif;color:#e4e4f0;background:#0f0f11;box-sizing:border-box;overflow:hidden">
          <div style="font-size:18px;font-weight:600;margin-bottom:8px">Aucun trick disponible</div>
          <p style="margin:0;color:#a1a1b5">Aucune donnée de tricks n'est visible pour ce module.</p>
        </div>`;
    }

    const metadataByTrickId = new Map();
    (state.trickMetadatas || []).forEach(meta => {
      const items = metadataByTrickId.get(meta.trickId) || [];
      items.push(meta);
      metadataByTrickId.set(meta.trickId, items);
    });

    const formatKeyLabel = key => {
      if (!key || typeof key !== 'object') return '';
      const tonic = key.tonic === 0 ? 'C' : key.tonic === 1 ? 'C#/Db' : key.tonic === 2 ? 'D' : key.tonic === 3 ? 'D#/Eb' : key.tonic === 4 ? 'E' : key.tonic === 5 ? 'F' : key.tonic === 6 ? 'F#/Gb' : key.tonic === 7 ? 'G' : key.tonic === 8 ? 'G#/Ab' : key.tonic === 9 ? 'A' : key.tonic === 10 ? 'A#/Bb' : key.tonic === 11 ? 'B' : '';
      const mode = key.mode === 0 ? 'Majeur' : key.mode === 1 ? 'Dorien' : key.mode === 2 ? 'Phrygien' : key.mode === 3 ? 'Lydien' : key.mode === 4 ? 'Mixolydien' : key.mode === 5 ? 'Aeolien' : key.mode === 6 ? 'Locrien' : '';
      return [tonic, mode].filter(Boolean).join(' - ');
    };

    const trickPool = tricks.map(trick => {
      const metas = metadataByTrickId.get(trick.id) || [];
      const meta = metas[0] || {};
      const genre = (state.musicGenres || []).find(g => g.id === meta.musicGenreId);
      const part = (state.musicParts || []).find(p => p.id === meta.musicPartId);
      const artist = (state.artists || []).find(a => a.id === meta.artistId);
      const source = (state.sources || []).find(s => s.id === meta.sourceId);
      return {
        id: trick.id,
        description: trick.description || '',
        source: trick._sourceFile || 'Local',
        genre: genre ? genre.name : '',
        part: part ? part.name : '',
        artist: artist ? artist.name : '',
        key: source && source.key ? formatKeyLabel(source.key) : '',
        bpm: source && source.bpm ? String(source.bpm) : '',
      };
    });

    const uniqueValues = (field, fallback = '') => {
      const values = Array.from(new Set(trickPool.map(item => item[field]).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));
      return values;
    };

    const artists = uniqueValues('artist');
    const genres = uniqueValues('genre');
    const parts = uniqueValues('part');
    const keys = uniqueValues('key');
    const bpms = uniqueValues('bpm').sort((a, b) => Number(a) - Number(b));

    const poolJson = JSON.stringify(trickPool);
    const artistOptions = artists.map(v => `<label class="filter-option" style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a1a1b5;line-height:1.2"><input type="checkbox" value="${v}" class="filter-checkbox" data-filter="artist">${v}</label>`).join('');
    const genreOptions = genres.map(v => `<label class="filter-option" style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a1a1b5;line-height:1.2"><input type="checkbox" value="${v}" class="filter-checkbox" data-filter="genre">${v}</label>`).join('');
    const partOptions = parts.map(v => `<label class="filter-option" style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a1a1b5;line-height:1.2"><input type="checkbox" value="${v}" class="filter-checkbox" data-filter="part">${v}</label>`).join('');
    const keyOptions = keys.map(v => `<label class="filter-option" style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a1a1b5;line-height:1.2"><input type="checkbox" value="${v}" class="filter-checkbox" data-filter="key">${v}</label>`).join('');
    const bpmOptions = bpms.map(v => `<label class="filter-option" style="display:flex;align-items:center;gap:6px;font-size:11px;color:#a1a1b5;line-height:1.2"><input type="checkbox" value="${v}" class="filter-checkbox" data-filter="bpm">${v}</label>`).join('');

    return `
      <div style="padding:10px 10px 8px;font-family:IBM Plex Sans,system-ui,sans-serif;color:#e4e4f0;background:#0f0f11;box-sizing:border-box;overflow:hidden">
        <div style="display:grid;gap:8px;margin:0 0 8px 0;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font-size:12px;color:#a1a1b5">Artiste</span>
            <input type="text" class="filter-search" data-filter="artist" placeholder="Rechercher" style="padding:6px 8px;border:1px solid #3a3a44;border-radius:6px;background:#1e1e23;color:#e4e4f0;font-size:11px">
            <div class="filter-options" data-filter="artist" style="display:flex;flex-direction:column;gap:3px;max-height:88px;overflow:auto;padding:6px;border:1px solid #3a3a44;border-radius:8px;background:#1e1e23">${artistOptions || '<span style="font-size:11px;color:#6b6b7e">Aucun</span>'}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font-size:12px;color:#a1a1b5">Genre</span>
            <input type="text" class="filter-search" data-filter="genre" placeholder="Rechercher" style="padding:6px 8px;border:1px solid #3a3a44;border-radius:6px;background:#1e1e23;color:#e4e4f0;font-size:11px">
            <div class="filter-options" data-filter="genre" style="display:flex;flex-direction:column;gap:3px;max-height:88px;overflow:auto;padding:6px;border:1px solid #3a3a44;border-radius:8px;background:#1e1e23">${genreOptions || '<span style="font-size:11px;color:#6b6b7e">Aucun</span>'}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font-size:12px;color:#a1a1b5">Partie</span>
            <input type="text" class="filter-search" data-filter="part" placeholder="Rechercher" style="padding:6px 8px;border:1px solid #3a3a44;border-radius:6px;background:#1e1e23;color:#e4e4f0;font-size:11px">
            <div class="filter-options" data-filter="part" style="display:flex;flex-direction:column;gap:3px;max-height:88px;overflow:auto;padding:6px;border:1px solid #3a3a44;border-radius:8px;background:#1e1e23">${partOptions || '<span style="font-size:11px;color:#6b6b7e">Aucun</span>'}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font-size:12px;color:#a1a1b5">Clé</span>
            <input type="text" class="filter-search" data-filter="key" placeholder="Rechercher" style="padding:6px 8px;border:1px solid #3a3a44;border-radius:6px;background:#1e1e23;color:#e4e4f0;font-size:11px">
            <div class="filter-options" data-filter="key" style="display:flex;flex-direction:column;gap:3px;max-height:88px;overflow:auto;padding:6px;border:1px solid #3a3a44;border-radius:8px;background:#1e1e23">${keyOptions || '<span style="font-size:11px;color:#6b6b7e">Aucune</span>'}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font-size:12px;color:#a1a1b5">BPM</span>
            <input type="text" class="filter-search" data-filter="bpm" placeholder="Rechercher" style="padding:6px 8px;border:1px solid #3a3a44;border-radius:6px;background:#1e1e23;color:#e4e4f0;font-size:11px">
            <div class="filter-options" data-filter="bpm" style="display:flex;flex-direction:column;gap:3px;max-height:88px;overflow:auto;padding:6px;border:1px solid #3a3a44;border-radius:8px;background:#1e1e23">${bpmOptions || '<span style="font-size:11px;color:#6b6b7e">Aucun</span>'}</div>
          </div>
        </div>
        <div id="result" style="padding:8px 10px;border:1px solid #2d2d35;border-radius:8px;background:#16161a;overflow:visible;font-size:12px;line-height:1.35"></div>
        <button style="padding:8px 12px;border:none;border-radius:8px;background:#6c63ff;color:#fff;cursor:pointer;margin-top:8px;font-size:13px" onclick="generateRandomTrick()">Générer</button>
        <script>
          const trickPool = ${poolJson};
          function escapeHtml(value) {
            return String(value || '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\"/g, '&quot;');
          }
          function applyFilterSearch() {
            document.querySelectorAll('.filter-search').forEach(input => {
              const filter = input.getAttribute('data-filter');
              const container = document.querySelector('.filter-options[data-filter="' + filter + '"]');
              if (!container) return;
              const query = (input.value || '').trim().toLowerCase();
              container.querySelectorAll('.filter-option').forEach(option => {
                const text = option.textContent.trim().toLowerCase();
                option.style.display = query && !text.includes(query) ? 'none' : '';
              });
            });
          }
          function getFilters() {
            const selected = {};
            document.querySelectorAll('.filter-checkbox').forEach(input => {
              if (!input.checked) return;
              const key = input.getAttribute('data-filter');
              if (!selected[key]) selected[key] = [];
              selected[key].push(input.value);
            });
            return selected;
          }
          function getFilteredPool() {
            const filters = getFilters();
            return trickPool.filter(item => {
              if (filters.artist && filters.artist.length && !filters.artist.includes(item.artist)) return false;
              if (filters.genre && filters.genre.length && !filters.genre.includes(item.genre)) return false;
              if (filters.part && filters.part.length && !filters.part.includes(item.part)) return false;
              if (filters.key && filters.key.length && !filters.key.includes(item.key)) return false;
              if (filters.bpm && filters.bpm.length && !filters.bpm.includes(item.bpm)) return false;
              return true;
            });
          }
          function renderTrick(item) {
            const result = document.getElementById('result');
            if (!item) {
              result.innerHTML = '<p style="color:#f59e0b;margin:0">Aucun trick ne correspond à ces filtres.</p>';
              return;
            }
            result.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px">' +
              '<div style="grid-column:1 / -1"><div style="color:#7c7ca3;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">Description</div><div style="margin-top:2px;white-space:normal;word-break:break-word">' + escapeHtml(item.description || '—') + '</div></div>' +
              '<div><div style="color:#7c7ca3;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">ID</div><div style="margin-top:2px">' + escapeHtml(item.id || '—') + '</div></div>' +
              '<div><div style="color:#7c7ca3;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">Artiste</div><div style="margin-top:2px">' + escapeHtml(item.artist || '—') + '</div></div>' +
              '<div><div style="color:#7c7ca3;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">Genre</div><div style="margin-top:2px">' + escapeHtml(item.genre || '—') + '</div></div>' +
              '<div><div style="color:#7c7ca3;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">Partie</div><div style="margin-top:2px">' + escapeHtml(item.part || '—') + '</div></div>' +
              '<div><div style="color:#7c7ca3;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">Clé</div><div style="margin-top:2px">' + escapeHtml(item.key || '—') + '</div></div>' +
              '<div><div style="color:#7c7ca3;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">BPM</div><div style="margin-top:2px">' + escapeHtml(item.bpm || '—') + '</div></div>' +
              '<div><div style="color:#7c7ca3;font-size:11px;text-transform:uppercase;letter-spacing:0.04em">Source</div><div style="margin-top:2px">' + escapeHtml(item.source || '—') + '</div></div>' +
              '</div>';
          }
          function generateRandomTrick() {
            const filteredPool = getFilteredPool();
            const pick = filteredPool[Math.floor(Math.random() * filteredPool.length)] || null;
            renderTrick(pick);
          }
          document.querySelectorAll('.filter-search').forEach(input => {
            input.addEventListener('input', applyFilterSearch);
          });
          document.querySelectorAll('.filter-checkbox').forEach(input => {
            input.addEventListener('change', generateRandomTrick);
          });
          window.generateRandomTrick = generateRandomTrick;
          generateRandomTrick();
        </script>
      </div>`;
  }
};
