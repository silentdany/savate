# Tests de bout en bout

Ces scripts vérifient les critères du cahier des charges dans un vrai navigateur
(Playwright + Chromium). Ils attaquent une **build de production** servie
localement, parce que le service worker n'est enregistré qu'en production.

```bash
npm run build && npx next start -p 3177
```

Puis, dans un autre terminal :

| Script | Ce qu'il vérifie |
|---|---|
| `npm run e2e:acceptation` | Lots 1, 2, 5 + survie des données à un kill de l'app |
| `npm run e2e:offline` | Mode avion : l'app démarre et une séance se lance sans réseau |
| `npm run e2e:seance` | Lot 3 : une séance de renfo loggée de bout en bout, zéro clavier |
| `npm run e2e:timer` | Lot 4 : gel du thread JS 30 s en plein round 2, temps juste au retour |
| `npm run e2e:audit` | axe-core + taille des cibles tactiles sur les 6 écrans |
| `npm run e2e:seed` | Le plan vient bien du fichier de seed, sans écraser les séances loggées |
| `npm run e2e:pwa` | Manifest, service worker, caches, `start_url` hors ligne |
| `npm run e2e:captures <dossier>` | Captures d'écran de tous les écrans |

`e2e:timer` prend environ deux minutes : il attend du temps réel, c'est le
principe même du test.

## Cibler un autre environnement

Tous les scripts lisent `BF_URL` (défaut `http://localhost:3177`), ce qui permet
de rejouer la même vérification contre la production :

```bash
BF_URL=https://savate.accura.dev npm run e2e:audit
```
