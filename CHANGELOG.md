# Journal des modifications

Toutes les évolutions notables de BypassNote sont consignées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le
projet respecte le [versionnage sémantique](https://semver.org/lang/fr/).

## [0.3.0] - 2026-10-28

Refonte de l'application en Expo / React Native, ajout de l'application desktop
Tauri et sélection des éléments à exporter.

### Ajouté

- Application desktop Tauri v2 (`src-tauri`) empaquetant le build web Expo,
  avec scripts `npm run dev` / `npm run build`, icônes et consignes de build.
- Workflow CI Tauri : lint, tests unitaires et smoke test Windows.
- Sauvegarde automatique de l'état complet dans un fichier `.bpnote` local, avec
  réinitialisation de l'espace de travail qui supprime le brouillon.
- Sélection des collections puis des lignes à exporter, et nom du fichier
  `.bpnote` exporté.
- Compteurs d'éléments par collection dans le menu mobile.
- Tests unitaires Jest (`jest-expo`) et `node --test`, exécutés en CI sur les
  pull requests.
- Instructions agents et règles de test (`AGENTS.md`).

### Modifié

- Migration vers Expo Router + React Native Web (Android, web), application
  déplacée à la racine du dépôt ; le build web Expo (`dist/`) sert de frontend
  à Capacitor comme à Tauri.
- La pastille de version de la barre de navigation lit désormais la version de
  `package.json` au lieu d'une constante codée en dur.
- Le menu burger et le panneau de module se referment après une action.
- Colonnes du tableau de collection plus compactes.

### Corrigé

- Normalisation des URL YouTube lors de la résolution des sources.
- Préremplissage du mode de clé source dans le formulaire d'édition.

### Supprimé

- Anciens fichiers web (`www/`) et protobuf legacy, remplacés par l'application
  Expo et le descripteur généré `src/lib/bpnote_pb.json`.

## [0.2.0] - 2026-07-08

### Ajouté

- Saisie du tempo par tap dans le champ BPM de l'édition des sources.
- Architecture standardisée des modules et module modèle (`templates/`).
- Workflow GitHub Actions de build des modules, déclenché aussi par les tags.

### Corrigé

- Nettoyage du répertoire `android/` avant `cap sync` dans la CI.
- Déclenchement du workflow restreint à `main` pour les GitHub Releases.

## [0.1.0] - 2026-06-24

- Première version bêta publique : application web BypassNote (collections,
  édition des éléments, modules) et export Android via Capacitor.
