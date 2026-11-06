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

### Rapport dans la PR

Le rapport détaillé est publié par **Codecov** (`codecov/codecov-action`) à partir de
`coverage/lcov.info`. L'upload est non bloquant (`fail_ci_if_error: false`) pour que
l'absence de token ne fasse pas échouer la CI. Un résumé texte est également écrit
dans `GITHUB_STEP_SUMMARY`.

## Seuils

Les seuils actuels servent de **ligne de base anti-régression** : ils sont légèrement
sous la couverture réelle pour que la CI reste verte, puis doivent être relevés au fur
et à mesure que des tests sont ajoutés. L'objectif long terme reste 70 %.

| Métrique | Seuil actuel |
|---|---|
| Branches | 35 % |
| Fonctions | 40 % |
| Lignes | 50 % |
| Instructions | 48 % |

Ajustez `coverageThreshold` dans `jest.config.js` et le paramètre `threshold` de
l'action CI en même temps.

## Exclusions courantes

Les fichiers suivants sont exclus de la couverture :

- `*.d.ts` — types uniquement
- `__tests__/` — modules dédiés aux tests
- `node_modules/`
- Fichiers de config (`*.json`, `*.proto`, `*.yml`)
