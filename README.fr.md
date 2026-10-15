# Pain Pointer MCP

*[English version](README.md)*

Serveur MCP App qui affiche dans Claude des dessins anatomiques sur lesquels on peint au doigt : corps (face et dos), dents vues de dessus, visage, tête de profil, main, pied, genou et épaule. Un pinceau par symptôme (douleur, gonflement, peau, engourdissement), une gomme, annuler et plein écran. « Envoyer à Claude » poste dans la conversation la liste des zones peintes avec leur nom anatomique et leur part, plus une image de la peinture si l'hôte accepte les images. Les zones sont calculées à partir de régions nommées invisibles sous le dessin.

L'interface et les messages existent en français et en anglais. La langue suit celle de l'app, l'argument `lang` de l'outil, ou le bouton FR/EN.

Le serveur est sans état : rien n'est stocké.

## L'utiliser dans Claude

1. Dans Claude (web ou desktop), va dans Customize > Connectors, puis « + Add » > « Add custom connector ».
2. Colle l'adresse du serveur, `https://<ton-projet>.vercel.app/mcp`, et choisis « No sign in ».
3. Dans une conversation, active le connecteur et demande par exemple « montre-moi le schéma des dents ».

Un connecteur ajouté sur le web ou le desktop apparaît ensuite sur mobile.

## L'outil

`show_body_map` prend trois arguments facultatifs :

- `schema` : `corps`, `dents`, `visage`, `tete`, `main`, `pied`, `genou`, `epaule`, ou les alias anglais `body`, `teeth`, `face`, `head`, `hand`, `foot`, `knee`, `shoulder`.
- `side` : `droite`/`gauche` ou `right`/`left`, pour la tête, la main, le pied, le genou et l'épaule.
- `lang` : `fr` ou `en`.

Les dents suivent la numérotation FDI. Pour la gencive, le message précise le côté peint : joue ou lèvre à l'extérieur, palais ou langue à l'intérieur.

## Structure

- `server/` : ce qui est déployé. Fonction Vercel `api/mcp.js` (Streamable HTTP, sans état), réécrite sur `/mcp`. L'interface est embarquée dans `lib/app-html.js`.
- `ui/` : source de l'interface. `src/assets/` contient les dessins, `src/catalog.js` les assemble et nomme les zones, `src/i18n.js` contient les traductions, `src/main.js` gère la peinture, l'analyse et l'envoi. `test-host/` est un hôte MCP Apps minimal pour les tests de bout en bout.

## Déployer

En ligne de commande :

```bash
cd server
npm install
npx vercel --prod
```

Ou branche ce dépôt sur Vercel avec **Root Directory** réglé sur `server` : chaque push sur `main` redéploie.

Dans les deux cas, désactive la protection des déploiements Vercel (Deployment Protection) pour ce projet, sinon Claude reçoit une page de connexion au lieu du serveur.

## Modifier les dessins ou l'interface

```bash
cd ui
npm install
npm run build
npm run embed
```

`embed` copie l'interface construite dans `server/lib/app-html.js`. Commite ce fichier, puis redéploie. Test local : `cd server && npm run dev`, endpoint `http://localhost:3001/mcp`.

L'adresse de la ressource d'interface change à chaque version (empreinte de son contenu), pour que les hôtes qui la gardent en cache chargent la nouvelle. Ils ne le font qu'après avoir relu la liste des outils, en pratique dans une nouvelle conversation.

## Conventions d'orientation

- Corps de face, visage, dents (vue de dessus des deux mâchoires) : la droite de la personne est à gauche de l'écran.
- Corps de dos, et vues arrière du genou et de l'épaule : vu de derrière.
- Genou et épaule de face : zoom sur le corps vu de face.
- Main et pied (dessus) : comme on regarde sa propre main, son propre pied. Plante du pied : vue de dessous.

## Crédits des dessins

- Corps (face, dos, zooms genou et épaule) : react-native-body-highlighter v3.2.0, © 2022 ELABBASSI Hicham, licence MIT.
- Dents : react-odontogram v0.6.0, © Pratik Sharma (biomathcode), licence MIT.
- Visage, tête de profil, main, pied : dessins originaux de ce projet.

Les textes complets des licences sont dans [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
