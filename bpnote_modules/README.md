# Modules BypassNote

Cette structure a pour but de rendre la création de modules simple, claire et extensible.

## Principe

Un module = un dossier autonome avec :
- un fichier de métadonnées : manifest.json
- un point d’entrée : index.js
- une documentation optionnelle : README.md
- des ressources optionnelles : assets/, locales/

## Arborescence recommandée

```text
bpnote_modules/
  README.md
  templates/
    basic-module/
      manifest.json
      index.js
      README.md
  examples/
    random-trick/
      manifest.json
      index.js
      README.md
```

## Règles simples

1. Chaque module a un identifiant unique stable : id
2. Chaque module expose un point d’entrée JavaScript
3. Le code doit rester isolé et ne dépendre que des helpers fournis par l’application
4. Les fichiers de documentation et d’assets sont optionnels, mais recommandés

## Format du manifest

```json
{
  "id": "mon-module",
  "name": "Mon module",
  "version": "1.0.0",
  "description": "Description courte",
  "author": "Nom",
  "entry": "index.js"
}
```

## Format du point d’entrée

```js
module.exports = {
  id: 'mon-module',
  name: 'Mon module',
  description: 'Description courte',
  version: '1.0.0',
  createPage({ state, getVisibleItems, helpers }) {
    return `<div>...</div>`;
  }
};
```

## Paquetage pour installation (.zip)

Pour une installation simple sur Android, un module peut aussi être distribué sous forme de fichier .zip avec cette structure :

```text
mon-module.zip
  manifest.json
  index.js
  README.md   (optionnel)
```

Exemple de manifest :

```json
{
  "id": "mon-module",
  "name": "Mon module",
  "version": "1.0.0",
  "description": "Description courte",
  "entry": "index.js"
}
```

L’utilisateur peut alors ouvrir BypassNote, ouvrir la fenêtre des modules, puis sélectionner le .zip.
Important : l’archive doit contenir directement les fichiers à la racine, sans dossier parent autour du module.

## Recommandation future

À terme, l’application pourrait scanner automatiquement ce dossier, lire les manifests et charger les modules depuis leurs dossiers. Pour l’instant, cette structure reste compatible avec l’installation manuelle d’un fichier .js.
