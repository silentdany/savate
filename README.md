# Savate

**En ligne : https://savate.accura.dev** (miroir : https://savate.vercel.app)

App perso mono-utilisateur pour dérouler un plan de savate boxe française au
dojo, téléphone en main, entre deux rounds. Hors ligne, sombre, gros boutons.

```bash
npm install
npm run dev
```

Build de production (nécessaire pour tester le service worker) :

```bash
npm run build && npm start
```

## Modifier le plan

**Un seul fichier** : [`src/lib/seed/plan-savate.ts`](src/lib/seed/plan-savate.ts).
Séances, blocs, exercices, table de progression sur 8 semaines, jours de la
semaine, seuils de vigilance. Aucun composant ne connaît le contenu du plan.

Le plan est réécrit en base à chaque démarrage depuis ce fichier : éditer, puis
recharger l'app. Les séances déjà loggées ne sont jamais touchées.

Deux règles en éditant :

- les `id` d'exercice doivent rester **uniques et stables** — c'est par eux que
  passe le pré-remplissage « valeurs de la dernière séance identique » ;
- une consigne peut contenir `{rounds}`, `{tours}`, `{intensite}` ou
  `{cardioFormat}` : les valeurs de la semaine courante y sont injectées.

## Architecture

| Chemin | Rôle |
|---|---|
| `src/lib/types.ts` | Modèle de données (identifiants stables, timestamps ISO, aucun état dérivé stocké) |
| `src/lib/seed/plan-savate.ts` | **Contenu du plan** |
| `src/lib/db.ts` | Couche Dexie / IndexedDB, lectures et écritures |
| `src/lib/progression.ts` | Application de la semaine à une séance, déroulé, libellés |
| `src/lib/chrono.ts` | Chronométrage par delta de timestamps, horloge partagée |
| `src/lib/rounds.ts` | Séquence de rounds, fonction pure du temps écoulé |
| `src/lib/backup.ts` | Export / import JSON |
| `public/sw.js` | Service worker : app shell hors ligne |
| `assets/` | Logo source ; `npm run icons` en régénère les icônes PWA |
| `e2e/` | Vérification des critères du cahier des charges (voir `e2e/README.md`) |

## Déploiement

Vercel, projet `savate`, connecté à ce dépôt : **un push sur `main` déploie en
production**. Aucune variable d'environnement, aucun backend, aucune dépendance
réseau au runtime.

Déploiement manuel si besoin :

```bash
vercel --prod
```

## Icônes

Dépose le logo dans `assets/logo.svg` (ou `.png`) puis :

```bash
npm run icons
```

Sans fichier, le script génère un mark géométrique de repli. Voir
[`assets/README.md`](assets/README.md).

## Notes

- La base IndexedDB s'appelle toujours `bf-dojo`, nom d'origine du projet. La
  renommer créerait une base vide à côté et rendrait orphelines les séances déjà
  loggées sur l'appareil ; le gain serait nul.
- Les données vivent dans IndexedDB, uniquement sur l'appareil. Pas de synchro.
  Le seul filet de sécurité est l'export JSON dans Réglages — pense à
  l'utiliser avant de changer de téléphone.
- Le plan fourni n'est pas un avis médical.
