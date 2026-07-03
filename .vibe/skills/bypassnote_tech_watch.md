---
name: bypassnote_tech_watch
description: Skill pour la veille technique sur BypassNote (Capacitor + Tauri).
version: 1.0.0
---

# 🔍 BypassNote - Veille Technique

---

## **📌 Contexte**
**BypassNote** : Application de gestion de notes musicales (astuces, accords, gammes).
**Stack** :
- **Mobile** : Capacitor (Android/iOS)
- **Desktop** : Tauri (Windows/macOS/Linux)
- **Web** : HTML/JS/CSS (monolithique)
- **Data** : Protobuf (fichiers `.bpnote`)

**Objectif** : Stabiliser la stack actuelle et préparer la migration future.

---

## **🎯 Instructions Générales**

### **À faire en priorité**
1. Vérifier les [issues GitHub](https://github.com/mapersmusic/BypassNote/issues) avant toute action.
2. Respecter la stack actuelle : **Capacitor pour le mobile**, **Tauri pour le desktop**.
3. Prioriser les **issues critiques** (#4, #5, #6, #8).
4. Proposer des solutions **compatibles avec Capacitor ET Tauri**.

---

## **🔧 Actions par Catégorie**

---

### **🔥 Critiques (À résoudre URGEMMENT)**
| ID | Titre | Commande/Action | Impact |
|----|-------|------------------|--------|
| #4 | `package-lock.json` manquant | `npm install && git add package-lock.json && git commit -m "chore: add package-lock.json"` | Builds reproductibles |
| #5 | Workflow CI : nettoyer `android/` | Ajouter `rm -rf android` avant `npx cap sync` dans `.github/workflows/android-release-apk.yml` | Builds stables |
| #6 | Workflow CI : pattern APK | Remplacer `*-signed.apk` par `android/app/build/outputs/apk/**/*.apk` | Déploiement APK |
| #8 | Secrets GitHub manquants | Configurer `RELEASE_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEYSTORE_ALIAS`, `KEYSTORE_ALIAS_PASSWORD` | APK signés |

---

### **⚠️ Haute Priorité**
| ID | Titre | Action | Impact |
|----|-------|--------|--------|
| #9 | Améliorer `README.md` | Ajouter setup pour Capacitor + Tauri | Documentation |
| #16 | Créer `CONTRIBUTING.md` | Documenter le workflow de développement | Onboarding |

**Exemple pour #9** :
```markdown
## Setup

### Mobile (Capacitor)
```bash
npm install
npm run build-proto
npx cap add android
npx cap sync android
npx cap run android
```

### Desktop (Tauri)
```bash
cd BypassNote-Tauri
npm install
npm run tauri dev
```
```

---

### **📌 Moyenne Priorité**
| ID | Titre | Action | Impact |
|----|-------|--------|--------|
| #10 | Tests unitaires (Jest) | Configurer Jest + tests Protobuf | Qualité de code |
| #11 | Refactorer le frontend | Séparer `BypassNote.html` en modules ES6 | Maintenabilité |
| #13 | Tests E2E (Playwright) | Configurer Playwright pour le web | Tests automatisés |
| #14 | i18n | Ajouter i18next pour le multilingue | UX |
| #18 | Thèmes personnalisables | Ajouter toggle dark/light | UX |
| #24 | PWA + Offline | Service Worker (Capacitor) + FS API (Tauri) | Mode hors ligne |

**Exemple pour #10 (Jest)** :
```bash
npm install -D jest @types/jest
```

```javascript
// __tests__/protobuf.test.js
const { BPNoteFile } = require('../www/bpnote_pb');

test('BPNoteFile encoding/decoding', () => {
  const file = new BPNoteFile();
  file.version = { major: 0, minor: 1 };
  const encoded = BPNoteFile.encode(file).finish();
  const decoded = BPNoteFile.decode(encoded);
  expect(decoded.version.major).toBe(0);
});
```

---

### **💡 Basse Priorité (Backlog)**
| ID | Titre | Action | Impact |
|----|-------|--------|--------|
| #1 | Tap tempo | Intégrer un composant tap tempo | Fonctionnalité utilisateur |
| #2 | Clavier virtuel | Ajouter un clavier pour les notes | UX |
| #19 | Recherche avancée | Filtres par artiste, BPM, etc. | UX |
| #20 | Collaboration | Partage de notes (liens/Cloud) | Fonctionnalité sociale |
| #21 | Sync Cloud | Firebase/Google Drive | Sauvegarde |

---

## **🛠 Outils**

---

### **Obligatoires**
- **Node.js** (v18+) : [nodejs.org](https://nodejs.org)
- **npm** : Inclus avec Node.js
- **Capacitor CLI** :
  ```bash
  npm install -g @capacitor/cli
  ```
- **Tauri CLI** :
  ```bash
  npm install -g @tauri-apps/cli
  ```
- **Protobuf.js CLI** :
  ```bash
  npm install -g protobufjs-cli
  ```

---

### **Recommandés**
- **Android Studio** : Pour les builds Android (Capacitor)
- **Rust** : Pour Tauri (via [rustup](https://rustup.rs/))
- **Jest** : Tests unitaires
  ```bash
  npm install -D jest @types/jest
  ```
- **Playwright** : Tests E2E (web)
  ```bash
  npm install -D @playwright/test
  ```
- **ESLint + Prettier** : Linting + formatage
  ```bash
  npm install -D eslint prettier
  ```

---

## **📋 Checklists**

---

### **Quotidienne**
- [ ] Vérifier les **nouvelles issues GitHub**
- [ ] Vérifier les **PR ouvertes** et proposer des reviews
- [ ] `npm outdated` (dépendances obsolètes)
- [ ] `npm audit` (vulnérabilités)
- [ ] Tester le workflow CI/CD (si changements récents)

---

### **Hebdomadaire**
- [ ] Analyser les **performances du workflow CI/CD**
- [ ] Vérifier les **dépendances obsolètes**
- [ ] Proposer des **améliorations pour la documentation**
- [ ] Vérifier la **compatibilité Capacitor/Tauri**
- [ ] Tester les **builds mobile et desktop**

---

### **Mensuelle**
- [ ] Mettre à jour la **roadmap** (issues GitHub)
- [ ] Vérifier la **sécurité** (secrets, `.gitignore`)
- [ ] Proposer des **optimisations de code**
- [ ] Analyser les **métriques** (taille APK, temps de build)

---

## **📄 Templates**

---

### **Issue Template**
```markdown
## Description
[Décrivez le problème ou la fonctionnalité]

## Steps to Reproduce
1. [Étape 1]
2. [Étape 2]

## Expected Behavior
[Comportement attendu]

## Actual Behavior
[Comportement actuel]

## Platform
- [ ] Capacitor (Mobile)
- [ ] Tauri (Desktop)
- [ ] Web

## Priority
- [ ] 🔥 Critical
- [ ] ⚠️ High
- [ ] 📌 Medium
- [ ] 💡 Low

## Related Issues
[Liens vers les issues liées]
```

---

### **PR Template**
```markdown
## Description
[Décrivez les changements]

## Related Issues
Closes #[numéro]

## Changes Made
- [ ] [Changement 1]
- [ ] [Changement 2]

## Testing
- [ ] Testé sur Capacitor (Android/iOS)
- [ ] Testé sur Tauri (Desktop)
- [ ] Testé sur Web

## Screenshots
[Ajoutez des captures si applicable]
```

---

## **🔗 Ressources**

---

### **Internes**
- [Issues GitHub](https://github.com/mapersmusic/BypassNote/issues)
- [Schéma Protobuf](bpnote_file/bpnote_0_1.proto)
- [Workflow CI/CD](.github/workflows/android-release-apk.yml)
- [Config Capacitor](capacitor.config.json)

---

### **Externes**
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Tauri Docs](https://tauri.app)
- [Protobuf.js](https://github.com/protobufjs/protobuf.js)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## **💡 Exemples**

---

### **1. Mettre à jour les dépendances**
```bash
npm outdated
npm install @capacitor/core@latest @capacitor/cli@latest
```

---

### **2. Corriger le workflow CI/CD**
**Problème** : Le workflow échoue car `android/` n'est pas nettoyé.
**Solution** :
```yaml
# Dans .github/workflows/android-release-apk.yml
- name: Clean Android platform
  run: rm -rf android
```

---

### **3. Configurer Tauri**
```bash
npx create-tauri-app@latest BypassNote-Tauri
cd BypassNote-Tauri
npm install @tauri-apps/plugin-fs
ln -s ../BypassNote/www src
npm run tauri dev
```

---

### **4. Ajouter des tests unitaires**
```bash
npm install -D jest
```

```javascript
const { BPNoteFile } = require('../www/bpnote_pb');

test('BPNoteFile works', () => {
  const file = new BPNoteFile();
  file.version = { major: 0, minor: 1 };
  const encoded = BPNoteFile.encode(file).finish();
  expect(BPNoteFile.decode(encoded).version.major).toBe(0);
});
```

---

## **🎯 Résumé**
1. **Stack** : Capacitor (mobile) + Tauri (desktop) + Protobuf.
2. **Priorité** : Issues critiques (#4-#8) + configurer Tauri.
3. **Futur** : Migration vers React Native (mobile) + Tauri (desktop).