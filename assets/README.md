# Assets sources

## `logo.svg`

Logo de la Fédération Française de Savate boxe française & Disciplines
Associées, récupéré le 19 août 2026 depuis le site officiel :

<https://www.ffsavate.com/content/themes/ffsavate/assets/images/svg/logo-shadow.svg>

Marque de la FFSBF&DA, utilisée ici pour une application d'entraînement
personnelle. Ce dépôt n'est ni un service officiel ni affilié à la fédération.

Dépose ici le logo sous le nom `logo.svg` (ou `.png`, `.jpg`, `.webp`), puis :

```bash
npm run icons
```

Les quatre icônes PWA de `public/icons/` sont régénérées : 192, 512, maskable
512 et apple-touch 180. Le logo est détouré sur le fond sombre de l'app, et la
variante maskable le garde dans la zone sûre des 60 % — Android rogne les bords.

Préfère un SVG, ou un PNG d'au moins 512 px de côté avec fond transparent.
Sans fichier ici, `npm run icons` retombe sur un mark géométrique généré.

Un autre chemin peut être passé en argument : `npm run icons -- chemin/logo.png`.

Le favicon est recadré sur le haut du logo (constante `FAVICON_RECADRAGE` dans
le script) : à 16-32 px, une signature textuelle n'est qu'une bouillie grise qui
mange la moitié du cadre. Mets la constante à `1` pour un logo sans texte.
