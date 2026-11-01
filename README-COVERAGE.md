# Couverture de tests (Code Coverage)

## Configuration

- **Runner** : Jest avec le preset `jest-expo` pour Expo modules (`src/`, `app/`)
- **DevDependencies nécessaires** :
  - `jest-expo` — preset pour Expo/React Native Web
  - `@testing-library/react-native` — tests de composants React Native

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `package.json` | Scripts `test` et `test:coverage`, seuils globaux |
| `jest.config.js` | `collectCoverageFrom`, `coverageThreshold`, patterns d'exclusion |
| `jest.setup.js` | Mocks Expo natifs (`expo-camera`, `reanimated`, …) |

## Scripts

```bash
npm test               # lance Jest + node --test sur les modules .bpnote
npm run test:coverage  # lance Jest avec rapport coverage
```

## Workflow CI (GitHub Actions)

Le workflow `.github/workflows/tests.yml` :

1. Installe les dépendances (`npm ci`)
2. Vérifie le type (`npx tsc --noEmit`)
3. Lance l'audit de sécurité (`npm run audit`)
4. Lance l'intégration (`npm run lint`)
5. **Exécute Jest avec coverage** et envoie le rapport à Codecov
6. Génère un résumé dans `GITHUB_STEP_SUMMARY`

### Sans Codecov (optionnel)

Le fichier `.github/workflows/tests.yml` inclut automatiquement l'action `ArtiomTr/jest-coverage-report-action@v2` qui génère un tableau par fichier directement dans le PR — aucune clé de Secret n'est nécessaire.

## Seuils

| Métrique | Valeur |
|---|---|
| Coverage global (lines) | 70 % |
| Coverage global (statements) | 70 % |

Ajustez `coverageThreshold` dans `jest.config.js` ou le paramètre `threshold` de l'action CI.

## Exclusions courantes

Les fichiers suivants sont exclus de la couverture :

- `*.d.ts` — types uniquement
- `__tests__/` — modules dédiés aux tests
- `node_modules/`
- Fichiers de config (`*.json`, `*.proto`, `*.yml`)
