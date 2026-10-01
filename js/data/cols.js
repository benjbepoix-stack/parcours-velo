/* Cols routiers : Alpes (France, Suisse, Italie), Jura, Vosges, Pyrénées.
   Chiffres indicatifs pour le versant indiqué (départ « from ») : longueur (km),
   pente moyenne et maximale (%), altitude du sommet (m). Le dénivelé est déduit
   de la longueur et de la pente moyenne. Coordonnées du sommet approximatives. */

export const SECTORS = [
  { id: 'alpes-nord', label: 'Alpes du Nord', short: 'Alpes N.', country: 'FR' },
  { id: 'alpes-sud', label: 'Alpes du Sud & Provence', short: 'Alpes S.', country: 'FR' },
  { id: 'suisse', label: 'Alpes suisses', short: 'Suisse', country: 'CH' },
  { id: 'italie', label: 'Alpes italiennes', short: 'Italie', country: 'IT' },
  { id: 'jura', label: 'Jura', short: 'Jura', country: 'FR · CH' },
  { id: 'vosges', label: 'Vosges', short: 'Vosges', country: 'FR' },
  { id: 'pyrenees', label: 'Pyrénées', short: 'Pyrénées', country: 'FR' }
];

// [id, nom, secteur, massif, altitude, départ, km, pente moy., pente max, lat, lon, note?]
const RAW = [
  // ---------- Alpes du Nord ----------
  ['galibier', 'Col du Galibier', 'alpes-nord', 'Savoie · Maurienne', 2642, 'Valloire', 18.1, 6.9, 12.1, 45.0640, 6.4078],
  ['galibier-lautaret', 'Col du Galibier (par le Lautaret)', 'alpes-nord', 'Hautes-Alpes · Oisans', 2642, 'Briançon', 35.0, 4.0, 10.1, 45.0640, 6.4078],
  ['telegraphe', 'Col du Télégraphe', 'alpes-nord', 'Savoie · Maurienne', 1566, 'Saint-Michel-de-Maurienne', 11.8, 7.1, 9.5, 45.2032, 6.4447],
  ['alpe-huez', 'Alpe d’Huez', 'alpes-nord', 'Isère · Oisans', 1850, 'Le Bourg-d’Oisans', 13.8, 8.1, 11.5, 45.0922, 6.0700, '21 lacets numérotés'],
  ['croix-de-fer', 'Col de la Croix de Fer', 'alpes-nord', 'Savoie · Maurienne', 2067, 'Saint-Jean-de-Maurienne', 29.4, 5.2, 11.0, 45.2268, 6.2026, 'Quelques replats et descentes'],
  ['glandon', 'Col du Glandon', 'alpes-nord', 'Savoie · Maurienne', 1924, 'Saint-Étienne-de-Cuines', 21.3, 6.9, 11.0, 45.2394, 6.1767],
  ['madeleine', 'Col de la Madeleine', 'alpes-nord', 'Savoie · Maurienne', 2000, 'La Chambre', 19.2, 7.9, 10.5, 45.4350, 6.3780],
  ['iseran', 'Col de l’Iseran', 'alpes-nord', 'Savoie · Haute-Maurienne', 2770, 'Bonneval-sur-Arc', 13.4, 7.3, 11.0, 45.4170, 7.0306, 'Plus haut col routier des Alpes françaises'],
  ['loze', 'Col de la Loze', 'alpes-nord', 'Savoie · Tarentaise', 2304, 'Brides-les-Bains', 21.6, 7.8, 20.0, 45.4060, 6.6040, 'Fin sur piste cyclable très raide'],
  ['mont-cenis', 'Col du Mont-Cenis', 'alpes-nord', 'Savoie · Haute-Maurienne', 2083, 'Lanslebourg', 9.8, 6.9, 10.0, 45.2577, 6.9010],
  ['cormet-roselend', 'Cormet de Roselend', 'alpes-nord', 'Savoie · Beaufortain', 1968, 'Bourg-Saint-Maurice', 19.3, 6.0, 10.0, 45.6868, 6.6886],
  ['saisies', 'Col des Saisies', 'alpes-nord', 'Savoie · Beaufortain', 1650, 'Beaufort', 15.1, 6.3, 10.0, 45.7580, 6.5330],
  ['col-du-pre', 'Col du Pré', 'alpes-nord', 'Savoie · Beaufortain', 1703, 'Beaufort', 12.6, 7.6, 12.0, 45.6920, 6.6110],
  ['petit-st-bernard', 'Col du Petit-Saint-Bernard', 'alpes-nord', 'Savoie · Tarentaise', 2188, 'Bourg-Saint-Maurice', 26.0, 5.3, 8.0, 45.6800, 6.8840],
  ['la-plagne', 'La Plagne', 'alpes-nord', 'Savoie · Tarentaise', 1970, 'Aime', 19.5, 6.6, 9.0, 45.5060, 6.6770],
  ['colombiere', 'Col de la Colombière', 'alpes-nord', 'Haute-Savoie · Aravis', 1613, 'Scionzier', 16.3, 6.8, 10.0, 45.9965, 6.4708],
  ['aravis', 'Col des Aravis', 'alpes-nord', 'Haute-Savoie · Aravis', 1486, 'Flumet', 11.8, 4.6, 7.0, 45.8742, 6.4640],
  ['croix-fry', 'Col de la Croix-Fry', 'alpes-nord', 'Haute-Savoie · Aravis', 1467, 'Thônes', 11.3, 7.4, 10.0, 45.8900, 6.4280],
  ['joux-plane', 'Col de Joux Plane', 'alpes-nord', 'Haute-Savoie · Chablais', 1691, 'Samoëns', 11.6, 8.5, 12.0, 46.1270, 6.7030],
  ['romme', 'Col de Romme', 'alpes-nord', 'Haute-Savoie · Aravis', 1297, 'Cluses', 8.8, 8.9, 11.0, 46.0490, 6.5800],
  ['ramaz', 'Col de la Ramaz', 'alpes-nord', 'Haute-Savoie · Chablais', 1619, 'Mieussy', 14.0, 7.0, 10.5, 46.1950, 6.5290],
  ['avoriaz', 'Avoriaz', 'alpes-nord', 'Haute-Savoie · Chablais', 1800, 'Morzine', 13.9, 6.0, 9.0, 46.1930, 6.7700],
  ['semnoz', 'Le Semnoz (Crêt de Châtillon)', 'alpes-nord', 'Haute-Savoie · Bauges', 1699, 'Annecy', 18.0, 6.9, 12.0, 45.7930, 6.0890],
  ['forclaz-montmin', 'Col de la Forclaz de Montmin', 'alpes-nord', 'Haute-Savoie · Lac d’Annecy', 1157, 'Vesonne', 7.6, 9.0, 14.0, 45.8260, 6.2810],
  ['revard', 'Mont Revard', 'alpes-nord', 'Savoie · Bauges', 1537, 'Aix-les-Bains', 22.5, 5.5, 9.0, 45.6780, 5.9945],
  ['granier', 'Col du Granier', 'alpes-nord', 'Savoie · Chartreuse', 1134, 'Chambéry', 15.5, 5.6, 9.0, 45.4635, 5.9306],
  ['col-de-porte', 'Col de Porte', 'alpes-nord', 'Isère · Chartreuse', 1326, 'Grenoble', 15.8, 6.9, 10.0, 45.2970, 5.7680],
  ['chamrousse', 'Chamrousse', 'alpes-nord', 'Isère · Belledonne', 1730, 'Uriage-les-Bains', 17.8, 7.4, 10.5, 45.1220, 5.8810],
  ['deux-alpes', 'Les Deux Alpes', 'alpes-nord', 'Isère · Oisans', 1650, 'Barrage du Chambon', 9.8, 7.0, 10.0, 45.0090, 6.1230],
  ['ornon', 'Col d’Ornon', 'alpes-nord', 'Isère · Oisans', 1371, 'Le Bourg-d’Oisans', 11.6, 5.6, 9.0, 44.9800, 5.9850],

  // ---------- Alpes du Sud & Provence ----------
  ['ventoux-bedoin', 'Mont Ventoux (Bédoin)', 'alpes-sud', 'Vaucluse', 1909, 'Bédoin', 21.5, 7.5, 12.0, 44.1740, 5.2785, 'Le versant mythique, par la forêt puis le désert lunaire'],
  ['ventoux-malaucene', 'Mont Ventoux (Malaucène)', 'alpes-sud', 'Vaucluse', 1909, 'Malaucène', 21.2, 7.2, 12.0, 44.1740, 5.2785],
  ['ventoux-sault', 'Mont Ventoux (Sault)', 'alpes-sud', 'Vaucluse', 1909, 'Sault', 25.7, 4.7, 9.0, 44.1740, 5.2785, 'Le versant le plus roulant'],
  ['lure', 'Montagne de Lure', 'alpes-sud', 'Alpes-de-Haute-Provence', 1826, 'Saint-Étienne-les-Orgues', 18.4, 6.2, 10.0, 44.1230, 5.8030],
  ['izoard', 'Col d’Izoard', 'alpes-sud', 'Hautes-Alpes · Queyras', 2360, 'Briançon', 19.0, 5.7, 9.0, 44.8203, 6.7348],
  ['izoard-guillestre', 'Col d’Izoard (Guillestre)', 'alpes-sud', 'Hautes-Alpes · Queyras', 2360, 'Guillestre', 31.5, 4.3, 10.0, 44.8203, 6.7348, 'Passe par la Casse Déserte'],
  ['agnel', 'Col Agnel', 'alpes-sud', 'Hautes-Alpes · Queyras', 2744, 'Château-Ville-Vieille', 20.6, 6.6, 13.0, 44.6840, 6.9790],
  ['vars', 'Col de Vars', 'alpes-sud', 'Hautes-Alpes', 2108, 'Guillestre', 19.3, 5.7, 10.0, 44.5390, 6.7030],
  ['granon', 'Col du Granon', 'alpes-sud', 'Hautes-Alpes · Briançonnais', 2413, 'Saint-Chaffrey', 11.5, 9.2, 11.5, 44.9620, 6.6070],
  ['lautaret', 'Col du Lautaret', 'alpes-sud', 'Hautes-Alpes · Briançonnais', 2058, 'Briançon', 27.0, 3.2, 6.0, 45.0350, 6.4045],
  ['noyer', 'Col du Noyer', 'alpes-sud', 'Hautes-Alpes · Dévoluy', 1664, 'Le Noyer', 7.5, 8.2, 11.0, 44.7230, 5.9790],
  ['bonette', 'Cime de la Bonette', 'alpes-sud', 'Alpes-de-Haute-Provence · Ubaye', 2802, 'Jausiers', 24.1, 6.6, 10.0, 44.3212, 6.8070, 'Plus haute route goudronnée de France'],
  ['allos', 'Col d’Allos', 'alpes-sud', 'Alpes-de-Haute-Provence · Ubaye', 2247, 'Barcelonnette', 19.9, 5.6, 9.0, 44.2970, 6.5930],
  ['cayolle', 'Col de la Cayolle', 'alpes-sud', 'Alpes-de-Haute-Provence · Ubaye', 2326, 'Barcelonnette', 29.0, 4.1, 8.0, 44.2590, 6.7440],
  ['turini', 'Col de Turini', 'alpes-sud', 'Alpes-Maritimes', 1607, 'La Bollène-Vésubie', 15.3, 7.2, 10.0, 43.9770, 7.3920],
  ['madone', 'Col de la Madone', 'alpes-sud', 'Alpes-Maritimes', 925, 'Menton', 13.0, 7.1, 10.0, 43.8100, 7.4460, 'Le col d’entraînement des pros de la Côte'],
  ['braus', 'Col de Braus', 'alpes-sud', 'Alpes-Maritimes', 1002, 'L’Escarène', 10.4, 6.2, 9.0, 43.8790, 7.3820],
  ['eze', 'Col d’Èze', 'alpes-sud', 'Alpes-Maritimes', 507, 'Nice', 10.0, 4.9, 8.0, 43.7490, 7.3550],

  // ---------- Alpes suisses ----------
  ['furka', 'Furkapass', 'suisse', 'Uri · Valais', 2429, 'Realp', 12.7, 7.0, 11.0, 46.5725, 8.4150],
  ['grimsel', 'Grimselpass', 'suisse', 'Berne · Valais', 2164, 'Innertkirchen', 26.0, 5.9, 9.0, 46.5615, 8.3370],
  ['susten', 'Sustenpass', 'suisse', 'Berne · Uri', 2224, 'Innertkirchen', 27.7, 5.8, 9.0, 46.7290, 8.4470],
  ['gotthard', 'Gotthardpass (Tremola)', 'suisse', 'Tessin · Uri', 2106, 'Airolo', 12.9, 7.4, 10.0, 46.5590, 8.5610, 'Tremola pavée : 24 lacets en pavés'],
  ['nufenen', 'Nufenenpass', 'suisse', 'Valais · Tessin', 2478, 'Ulrichen', 13.4, 8.4, 10.0, 46.4770, 8.3870],
  ['grand-st-bernard', 'Col du Grand-Saint-Bernard', 'suisse', 'Valais', 2469, 'Orsières', 27.0, 5.8, 10.0, 45.8690, 7.1710],
  ['simplon', 'Col du Simplon', 'suisse', 'Valais', 2005, 'Brig', 21.0, 6.3, 10.0, 46.2510, 8.0320],
  ['forclaz-vs', 'Col de la Forclaz', 'suisse', 'Valais', 1527, 'Martigny', 13.2, 8.0, 9.0, 46.0570, 7.0010],
  ['croix-villars', 'Col de la Croix', 'suisse', 'Vaud', 1778, 'Les Diablerets', 8.8, 7.0, 11.0, 46.3240, 7.1280],
  ['grosse-scheidegg', 'Grosse Scheidegg', 'suisse', 'Berne · Oberland', 1962, 'Meiringen', 16.3, 8.4, 13.0, 46.6540, 8.1030, 'Route fermée aux voitures, réservée aux bus et vélos'],
  ['klausen', 'Klausenpass', 'suisse', 'Glaris · Uri', 1948, 'Linthal', 23.0, 5.6, 10.0, 46.8690, 8.8550],
  ['oberalp', 'Oberalppass', 'suisse', 'Uri · Grisons', 2044, 'Andermatt', 10.1, 6.0, 9.0, 46.6590, 8.6710],
  ['albula', 'Albulapass', 'suisse', 'Grisons', 2312, 'Bergün', 12.7, 7.4, 12.0, 46.5820, 9.8380],
  ['fluela', 'Flüelapass', 'suisse', 'Grisons', 2383, 'Davos', 13.0, 6.3, 10.0, 46.7500, 9.9470],
  ['julier', 'Julierpass', 'suisse', 'Grisons', 2284, 'Silvaplana', 7.0, 6.7, 9.0, 46.4720, 9.7290],
  ['bernina', 'Berninapass', 'suisse', 'Grisons', 2328, 'Poschiavo', 18.6, 7.1, 10.0, 46.4120, 10.0210],

  // ---------- Alpes italiennes ----------
  ['stelvio', 'Passo dello Stelvio', 'italie', 'Haut-Adige', 2757, 'Prato allo Stelvio', 24.3, 7.4, 12.0, 46.5285, 10.4530, '48 lacets numérotés'],
  ['stelvio-bormio', 'Passo dello Stelvio (Bormio)', 'italie', 'Lombardie', 2757, 'Bormio', 21.5, 7.1, 12.0, 46.5285, 10.4530],
  ['mortirolo', 'Passo del Mortirolo', 'italie', 'Lombardie', 1852, 'Mazzo di Valtellina', 12.4, 10.5, 18.0, 46.2470, 10.2990, 'Un des cols les plus durs d’Europe'],
  ['gavia', 'Passo di Gavia', 'italie', 'Lombardie', 2621, 'Ponte di Legno', 17.3, 7.9, 16.0, 46.3440, 10.4880],
  ['zoncolan', 'Monte Zoncolan', 'italie', 'Frioul', 1750, 'Ovaro', 10.1, 11.9, 22.0, 46.5000, 12.9330, 'Pentes extrêmes : braquet de montagne obligatoire'],
  ['finestre', 'Colle delle Finestre', 'italie', 'Piémont', 2178, 'Meana di Susa', 18.5, 8.6, 14.0, 45.0720, 7.0530, 'Les 8 derniers km sont en terre'],
  ['fauniera', 'Colle Fauniera', 'italie', 'Piémont', 2480, 'Pradleves', 22.5, 7.4, 14.0, 44.3870, 7.1220],
  ['pordoi', 'Passo Pordoi', 'italie', 'Dolomites', 2239, 'Arabba', 9.4, 6.8, 8.0, 46.4880, 11.8120],
  ['sella', 'Passo Sella', 'italie', 'Dolomites', 2244, 'Canazei', 11.5, 6.8, 10.0, 46.5080, 11.7570],
  ['gardena', 'Passo Gardena', 'italie', 'Dolomites', 2121, 'Selva di Val Gardena', 9.5, 5.9, 8.0, 46.5490, 11.8070],
  ['giau', 'Passo Giau', 'italie', 'Dolomites', 2236, 'Selva di Cadore', 9.9, 9.3, 14.0, 46.4830, 12.0540, 'Face aux Cinque Torri, un des plus beaux des Dolomites'],
  ['fedaia', 'Passo Fedaia', 'italie', 'Dolomites', 2057, 'Caprile', 14.0, 7.4, 18.0, 46.4600, 11.8710, 'Ligne droite à 15 % après Malga Ciapela'],
  ['falzarego', 'Passo Falzarego', 'italie', 'Dolomites', 2105, 'Cortina d’Ampezzo', 16.0, 5.5, 8.0, 46.5190, 12.0080],
  ['tre-cime', 'Tre Cime di Lavaredo', 'italie', 'Dolomites', 2320, 'Misurina', 7.0, 8.1, 18.0, 46.6130, 12.2970, 'Route à péage, derniers km très raides'],
  ['grappa', 'Monte Grappa', 'italie', 'Vénétie', 1745, 'Romano d’Ezzelino', 25.6, 6.1, 11.0, 45.8710, 11.8010],
  ['ghisallo', 'Madonna del Ghisallo', 'italie', 'Lombardie · Lac de Côme', 754, 'Bellagio', 10.6, 5.0, 14.0, 45.9200, 9.2680, 'Chapelle et musée du cyclisme au sommet'],

  // ---------- Jura ----------
  ['grand-colombier', 'Grand Colombier', 'jura', 'Ain · Bugey', 1501, 'Culoz', 18.3, 6.8, 12.0, 45.9000, 5.7600, 'Le géant du Jura, passages à plus de 10 %'],
  ['mont-du-chat', 'Mont du Chat', 'jura', 'Savoie · Lac du Bourget', 1504, 'Le Bourget-du-Lac', 13.7, 8.8, 15.0, 45.6650, 5.8240],
  ['faucille', 'Col de la Faucille', 'jura', 'Ain · Pays de Gex', 1323, 'Gex', 11.2, 6.2, 9.0, 46.3650, 6.0360],
  ['marchairuz', 'Col du Marchairuz', 'jura', 'Vaud', 1447, 'Bière', 12.2, 6.2, 9.0, 46.5520, 6.2510],
  ['vue-des-alpes', 'Col de la Vue des Alpes', 'jura', 'Neuchâtel', 1283, 'Neuchâtel', 14.0, 5.7, 9.0, 47.0730, 6.8690],
  ['chasseral', 'Chasseral', 'jura', 'Berne', 1548, 'Saint-Imier', 13.0, 5.8, 10.0, 47.1330, 7.0590],
  ['weissenstein', 'Weissenstein', 'jura', 'Soleure', 1284, 'Oberdorf', 5.2, 12.0, 20.0, 47.2520, 7.5120, 'Court mais très raide'],
  ['grand-taureau', 'Le Grand Taureau', 'jura', 'Doubs · Haut-Doubs', 1323, 'Pontarlier', 5.3, 9.1, 12.0, 46.9240, 6.4140],

  // ---------- Vosges ----------
  ['planche-belles-filles', 'La Planche des Belles Filles', 'vosges', 'Haute-Saône', 1148, 'Plancher-les-Mines', 5.9, 8.5, 20.0, 47.7720, 6.7810, 'Arrivée du Tour, final très raide'],
  ['ballon-alsace', 'Ballon d’Alsace', 'vosges', 'Vosges · Territoire de Belfort', 1178, 'Saint-Maurice-sur-Moselle', 9.1, 6.8, 8.0, 47.8230, 6.8420, 'Premier col de l’histoire du Tour (1905)'],
  ['grand-ballon', 'Grand Ballon', 'vosges', 'Haut-Rhin', 1336, 'Willer-sur-Thur', 13.7, 6.9, 10.0, 47.9010, 7.0980],
  ['petit-ballon', 'Petit Ballon', 'vosges', 'Haut-Rhin', 1163, 'Wasserbourg', 9.0, 7.6, 11.0, 47.9850, 7.1530],
  ['schlucht', 'Col de la Schlucht', 'vosges', 'Vosges · Haut-Rhin', 1139, 'Munster', 17.0, 4.5, 7.0, 48.0640, 7.0200],

  // ---------- Pyrénées ----------
  ['tourmalet', 'Col du Tourmalet', 'pyrenees', 'Hautes-Pyrénées', 2115, 'Luz-Saint-Sauveur', 19.0, 7.4, 10.0, 42.9080, 0.1450, 'Le col le plus franchi par le Tour'],
  ['tourmalet-ste-marie', 'Col du Tourmalet (Sainte-Marie-de-Campan)', 'pyrenees', 'Hautes-Pyrénées', 2115, 'Sainte-Marie-de-Campan', 17.2, 7.4, 10.0, 42.9080, 0.1450],
  ['aubisque', 'Col d’Aubisque', 'pyrenees', 'Pyrénées-Atlantiques', 1709, 'Laruns', 16.6, 7.2, 10.0, 42.9770, -0.3390],
  ['soulor', 'Col du Soulor', 'pyrenees', 'Hautes-Pyrénées', 1474, 'Arrens-Marsous', 7.4, 8.0, 10.0, 42.9590, -0.2590],
  ['aspin', 'Col d’Aspin', 'pyrenees', 'Hautes-Pyrénées', 1490, 'Arreau', 12.0, 6.5, 9.5, 42.9450, 0.3290],
  ['peyresourde', 'Col de Peyresourde', 'pyrenees', 'Haute-Garonne', 1569, 'Bagnères-de-Luchon', 13.2, 7.0, 10.0, 42.7960, 0.4470],
  ['hautacam', 'Hautacam', 'pyrenees', 'Hautes-Pyrénées', 1520, 'Argelès-Gazost', 13.6, 7.8, 13.0, 42.9670, -0.0050],
  ['luz-ardiden', 'Luz Ardiden', 'pyrenees', 'Hautes-Pyrénées', 1715, 'Luz-Saint-Sauveur', 13.3, 7.6, 10.0, 42.8770, -0.0480],
  ['portet', 'Col du Portet', 'pyrenees', 'Hautes-Pyrénées', 2215, 'Saint-Lary-Soulan', 16.0, 8.7, 14.0, 42.8180, 0.3330],
  ['azet', 'Col de Val Louron-Azet', 'pyrenees', 'Hautes-Pyrénées', 1580, 'Saint-Lary-Soulan', 10.7, 7.0, 10.0, 42.8160, 0.4010],
  ['bales', 'Port de Balès', 'pyrenees', 'Haute-Garonne', 1755, 'Mauléon-Barousse', 19.2, 6.2, 11.0, 42.8770, 0.5390],
  ['superbagneres', 'Superbagnères', 'pyrenees', 'Haute-Garonne', 1800, 'Bagnères-de-Luchon', 18.5, 6.3, 9.0, 42.7620, 0.5770],
  ['plateau-beille', 'Plateau de Beille', 'pyrenees', 'Ariège', 1780, 'Les Cabannes', 15.8, 7.9, 10.0, 42.7270, 1.6900],
  ['agnes', 'Col d’Agnes', 'pyrenees', 'Ariège', 1570, 'Aulus-les-Bains', 10.4, 7.9, 12.0, 42.8000, 1.3570],
  ['marie-blanque', 'Col de Marie-Blanque', 'pyrenees', 'Pyrénées-Atlantiques', 1035, 'Escot', 9.3, 7.7, 13.0, 43.0640, -0.5100, '4 derniers km à plus de 11 %']
];

/** Indice de difficulté FIETS : D+² / (longueur × 10) + bonus d'altitude au-dessus de 1000 m. */
export function difficulty(col) {
  return (col.gain * col.gain) / (col.km * 1000 * 10) + Math.max(0, (col.alt - 1000) / 1000);
}

/** Catégorie façon Tour de France à partir de l'indice. */
export function category(col) {
  const d = difficulty(col);
  if (d >= 10) return 'HC';
  if (d >= 7) return '1';
  if (d >= 4.5) return '2';
  if (d >= 2.5) return '3';
  return '4';
}

export const COLS = RAW.map(([id, name, sector, area, alt, from, km, avg, max, lat, lon, note]) => {
  const col = { id, name, sector, area, alt, from, km, avg, max, lat, lon, note: note || null, gain: Math.round(km * avg * 10) };
  col.score = difficulty(col);
  col.cat = category(col);
  return col;
});

/** Sélection : dix cols à faire, avec la raison du choix. */
export const TOP10 = [
  ['ventoux-bedoin', 'Le Géant de Provence : forêt puis désert de cailloux blancs, vue sur toute la Provence. Un incontournable.'],
  ['galibier', 'Enchaîné avec le Télégraphe depuis Saint-Michel, plus de 2 000 m de montée au cœur des glaciers.'],
  ['alpe-huez', 'Les 21 virages numérotés aux noms des vainqueurs : la montée la plus célèbre du cyclisme.'],
  ['stelvio', '48 lacets taillés dans la montagne jusqu’à 2 757 m : la route de col la plus spectaculaire des Alpes.'],
  ['tourmalet', 'Le col le plus franchi par le Tour de France, à faire depuis Luz par la vallée.'],
  ['izoard', 'La Casse Déserte, ses éboulis et ses aiguilles de roche : un paysage unique.'],
  ['grand-colombier', 'Le géant du Jura, à 2 h de Besançon : pentes sévères et vue sur le lac du Bourget et le Mont-Blanc.'],
  ['furka', 'Glacier du Rhône, hôtel Belvédère et lacets de film : la plus belle montée de Suisse.'],
  ['giau', 'Au cœur des Dolomites, face aux Cinque Torri : régulier, raide et d’une beauté rare.'],
  ['mortirolo', 'Le défi ultime : 12 km à plus de 10 %, sous les arbres. À garder pour une grande forme.']
].map(([id, why], i) => ({ rank: i + 1, why, col: COLS.find(c => c.id === id) }));
