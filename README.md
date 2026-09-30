# Parcours vélo

Application web (installable sur iPhone et Android) qui propose des **boucles de vélo de route** adaptées à ta séance, **au vent du jour** et **loin des grands axes**.

## Fonctionnalités

- **Séances** : endurance, récupération, intervalles, côtes, sortie longue ou libre. Chaque séance fixe l'intensité (en % de ta FTP) et le dénivelé visé ; distance et dénivelé restent modifiables.
- **Vent** : prévisions heure par heure (Open-Meteo) au point de départ. Huit boucles sont calculées dans toutes les directions, la première face au vent, puis simulées mètre par mètre avec ta puissance, ton poids, ta position, la pente et le vent prévu à l'heure du passage. Le classement privilégie **l'aller face au vent et le retour vent dans le dos**.
- **Meilleur créneau** : pour la boucle choisie, la durée estimée selon l'heure de départ (6 h – 20 h), avec le risque de pluie. Un appui sur une barre change l'heure et recalcule tout, sans refaire les itinéraires.
- **Routes tranquilles** : itinéraires [BRouter](https://brouter.de) sur OpenStreetMap, profils *Standard*, *Peu de trafic* ou *Très peu de trafic*. Chaque boucle affiche la part de petites routes, de départementales, de grands axes, de revêtement non asphalté et d'itinéraires cyclables balisés, avec des alertes (grands axes, chemins, rafales, pluie, routes empruntées deux fois).
- **Carte** : fond CyclOSM (pensé pour le vélo), standard ou relief, calque des itinéraires cyclables balisés ; tracé coloré selon le vent (dos / côté / face) avec le sens de parcours. Les autres boucles restent visibles et se sélectionnent d'un appui.
- **Profil altimétrique** avec la bande de vent rencontré.
- **Export GPX** (Garmin, Wahoo, Komoot, Strava…) via la feuille de partage sur mobile.
- **Favoris** : enregistre une boucle, rouvre-la plus tard avec le vent d'un autre jour, renomme, exporte, supprime.
- **Profil cycliste** : FTP, poids, poids du vélo et position sur le vélo.
- **Heatmap Strava** : lien vers la heatmap centrée sur la boucle pour vérifier que les cyclistes empruntent ces routes. (Strava ne propose pas d'accès public à ses tuiles : elles ne peuvent pas être intégrées au calcul.)
- Thème clair / sombre, fonctionne hors ligne pour l'interface, les favoris et l'export (le calcul d'itinéraires et la météo demandent du réseau).

Tout est gratuit et sans clé d'API : BRouter, Open-Meteo, Nominatim, tuiles OpenStreetMap / CyclOSM / OpenTopoMap / Waymarked Trails. Les données personnelles (profil, favoris) restent dans le navigateur.

## Publier avec GitHub Pages

1. Sur GitHub : **Settings → Pages**.
2. *Source* : **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
3. Après une minute, l'app est en ligne sur `https://benjbepoix-stack.github.io/parcours-velo/`.
4. Sur iPhone : ouvrir le lien dans Safari → **Partager → Sur l'écran d'accueil**.

## Lancer en local

```bash
python3 -m http.server 8080   # ou : npm start
# puis http://localhost:8080
```

## Tests

```bash
npm test
```

Les tests couvrent le moteur de calcul (`js/core/ride.js`) : géométrie, modèle de vitesse, vent, score, analyse des routes, créneaux, simplification et GPX. Ils tournent aussi à chaque push (GitHub Actions).

## Structure

```
index.html              Squelette de l'app
css/app.css             Styles (thèmes clair / sombre)
js/app.js               Interface : formulaire, résultats, favoris, profil
js/core/ride.js         Moteur : géométrie, boucles, physique, vent, score, GPX (sans DOM)
js/core/planner.js      Génération et classement des boucles
js/core/dates.js        Dates locales
js/services/            BRouter, Open-Meteo, Nominatim, stockage local
js/ui/                  Carte Leaflet, graphiques SVG, icônes
vendor/leaflet/         Leaflet 1.9.4 (licence BSD-2)
sw.js                   Service worker (hors ligne)
tests/                  Tests du moteur (node --test)
```

## Limites

- Le serveur public brouter.de est partagé : un calcul lance une dizaine de requêtes ; en cas de lenteur, patienter ou réessayer.
- Les estimations de durée supposent une puissance constante, sans arrêts.
- « Belles routes » n'est pas une donnée disponible librement : l'app s'en approche en évitant le trafic et en privilégiant petites routes et itinéraires cyclables.
