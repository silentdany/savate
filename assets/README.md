# Assets sources

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
