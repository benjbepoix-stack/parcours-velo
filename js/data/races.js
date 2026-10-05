/*
 * Cyclosportives : sélection curatée et mise à jour à la main (pas de flux
 * en direct), plus de 110 épreuves complétées d'après les calendriers 2026
 * (finishers, velo-cyclosport, Miles Republic), couvrant la France entière (régionale Franche-
 * Comté/Jura, Alpes & Provence, Pyrénées, Grand Est & Nord, Bretagne &
 * Normandie, Centre & Sud-Ouest, Occitanie & Corse).
 *
 * Chaque épreuve porte deux éditions estimées : l'édition « en cours »
 * et la « suivante ». La plupart des dates précises ne sont pas encore
 * annoncées aussi loin à l'avance : `date` est une estimation à partir
 * des éditions précédentes, à vérifier et corriger avant d'ajouter la
 * course au planning — le champ reste modifiable. `confirmed` indique
 * si la date de CETTE édition est officiellement annoncée.
 *
 * Mise à jour annuelle : voir le README (section « Courses »).
 */
export const RACES = [
  // --- Régional : Franche-Comté / Jura ---
  {
    id: 'bisontine',
    name: 'La Flèche Bisontine',
    group: 'regional',
    location: 'Besançon (Doubs)',
    period: 'Fin avril, date 2027 non annoncée (édition 2026 les 25-26 avril)',
    editions: [{ year: 2027, date: '2027-04-25', confirmed: false }, { year: 2028, date: '2028-04-23', confirmed: false }],
    distance: '130 et 90 km (boucle unique)',
    notes: 'Anciennement listée ici sous le nom générique « La Bisontine » : nom et distances corrigés d’après la fiche officielle (finishers.com).',
    link: 'https://www.laflechebisontine.fr/'
  },
  {
    id: 'cyclomontagnarde-jura',
    name: 'La Cyclomontagnarde du Jura',
    group: 'regional',
    location: 'Montmorot / Lons-le-Saunier (Jura)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 20 juin)',
    editions: [{ year: 2027, date: '2027-06-19', confirmed: false }, { year: 2028, date: '2028-06-17', confirmed: false }],
    distance: 'Plusieurs distances cyclo',
    notes: '⚠️ Source peu précise : à vérifier que ce n’est pas un autre nom pour la Cyclosportive La Vache qui rit (même secteur, Lons-le-Saunier).',
    link: 'https://ffvelo.fr/evenements/cyclomontagnarde-du-jura-2026/'
  },
  {
    id: 'monts-dor-jura',
    name: 'Cyclo des Monts d’Or (Jura)',
    group: 'regional',
    location: 'Jura',
    period: 'Printemps/été, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-06-06', confirmed: false }, { year: 2028, date: '2028-06-04', confirmed: false }],
    distance: 'Variable',
    notes: '⚠️ Un autre événement homonyme existe près de Lyon : vérifier l’organisateur avant de s’inscrire.',
    link: 'https://www.montsdorvelo.com/'
  },
  {
    id: 'defi-cret-monniot',
    name: 'Le Défi du Crêt Monniot',
    group: 'regional',
    location: 'Arc-sous-Cicon (Doubs)',
    period: 'Septembre, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-09-12', confirmed: false }, { year: 2028, date: '2028-09-10', confirmed: false }],
    distance: '13 et 8,5 km (format local, dénivelé concentré)',
    notes: '',
    link: 'https://fr.milesrepublic.com/cyclotourisme/doubs'
  },
  {
    id: 'vache-qui-rit',
    name: 'Cyclosportive La Vache qui rit',
    group: 'regional',
    location: 'Lons-le-Saunier (Jura)',
    period: 'Fin mai, date 2027 non annoncée (édition 2026 les 30-31 mai)',
    editions: [{ year: 2027, date: '2027-05-30', confirmed: false }, { year: 2028, date: '2028-05-28', confirmed: false }],
    distance: '35 / 58 / 78 / 103 / 114 / 156 km, route et gravel',
    notes: '',
    link: 'https://cyclosportive-lavachequirit.fr/'
  },
  {
    id: 'transju-cyclo',
    name: 'Transju’Cyclo',
    group: 'regional',
    location: 'Lamoura → Les Rousses (Jura)',
    period: 'Début septembre, date 2027 non annoncée (édition 2026 les 5-6 septembre)',
    editions: [{ year: 2027, date: '2027-09-04', confirmed: false }, { year: 2028, date: '2028-09-02', confirmed: false }],
    distance: 'Route (détail à confirmer sur le site)',
    notes: 'Organisée par le même comité que la Transjurassienne (ski de fond, voir l’app Trace).',
    link: 'https://www.finishers.com/en/event/transju-cyclo'
  },
  {
    id: 'louis-pasteur',
    name: 'La Louis Pasteur',
    group: 'regional',
    location: 'Dole (Jura)',
    period: 'Fin juin, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-06-27', confirmed: false }, { year: 2028, date: '2028-06-25', confirmed: false }],
    distance: '70 km (boucle unique)',
    notes: 'Organisée par le Vélo Club Dolois.',
    link: 'https://www.veloclubdolois.com/'
  },
  {
    id: 'gentleman-arinthod',
    name: 'Le Gentleman d’Arinthod',
    group: 'regional',
    location: 'Arinthod (Jura)',
    period: 'Fin août, date 2027 non annoncée (édition 2026 le 30 août)',
    editions: [{ year: 2027, date: '2027-08-29', confirmed: false }, { year: 2028, date: '2028-08-27', confirmed: false }],
    distance: '34 km en duo (boucle unique), 300 m D+',
    notes: 'Format gentleman (par équipe de 2). Organisé par le SC Arinthod.',
    link: 'https://scarinthod.jimdofree.com/gentleman-d-arinthod/'
  },
  {
    id: 'grand-braquet-rupt',
    name: 'GBR · Le Grand Braquet du Rupt',
    group: 'regional',
    location: 'Sainte-Marie (Doubs)',
    period: 'Mi-septembre, date 2027 non annoncée (édition 2026 le 13 septembre)',
    editions: [{ year: 2027, date: '2027-09-12', confirmed: false }, { year: 2028, date: '2028-09-10', confirmed: false }],
    distance: '48 km (gravel) / 93 et 152 km (route)',
    notes: '',
    link: 'https://www.finishers.com/en/event/gbr-the-great-braquet-of-rupt'
  },
  {
    id: 'roller-coaster-luxeuil',
    name: 'Roller Coaster · Luxeuil Vosges du Sud',
    group: 'regional',
    location: 'Luxeuil-les-Bains (Haute-Saône)',
    period: 'Juin, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-06-13', confirmed: false }, { year: 2028, date: '2028-06-11', confirmed: false }],
    distance: '62 / 115 / 195 km',
    notes: '',
    link: 'https://www.finishers.com/en/event/roller-coaster-luxeuil-southern-vosges'
  },
  {
    id: 'climbing-for-life',
    name: 'Climbing For Life',
    group: 'regional',
    location: 'Belfort (Territoire de Belfort)',
    period: 'Mi-août, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-08-15', confirmed: false }, { year: 2028, date: '2028-08-13', confirmed: false }],
    distance: '36 / 61 / 81 / 108 / 116 km',
    notes: '',
    link: 'https://www.finishers.com/en/event/climbing-for-life'
  },

  // --- Alpes & Provence ---
  {
    id: 'etape-du-tour',
    name: 'L’Étape du Tour',
    group: 'alpes-nord',
    location: 'Alpes (parcours variable selon l’édition)',
    period: 'Mi-juillet 2027, parcours non annoncé',
    editions: [{ year: 2027, date: '2027-07-11', confirmed: false }, { year: 2028, date: '2028-07-09', confirmed: false }],
    distance: 'Variable selon l’édition',
    notes: '',
    link: 'https://www.jds.fr/'
  },
  {
    id: 'marmotte-granfondo',
    name: 'La Marmotte Granfondo Alpes',
    group: 'alpes-nord',
    location: 'Bourg-d’Oisans (Isère)',
    period: '27 juin 2027 (confirmé)',
    editions: [{ year: 2027, date: '2027-06-27', confirmed: true }, { year: 2028, date: '2028-06-25', confirmed: false }],
    distance: 'Plusieurs distances, cols alpins',
    notes: '',
    link: 'https://www.intervalcoach.app/'
  },
  {
    id: 'ardechoise',
    name: 'L’Ardéchoise',
    group: 'alpes',
    location: 'Saint-Félicien (Ardèche)',
    period: '8–12 juin 2027 (confirmé, plusieurs jours)',
    editions: [{ year: 2027, date: '2027-06-08', confirmed: true }, { year: 2028, date: '2028-06-06', confirmed: false }],
    distance: '67 à 285 km selon le parcours (7 formules à la journée + formules 2–4 jours)',
    notes: 'Semaine à plusieurs formules : choisir le jour/parcours avant d’ajouter.',
    link: 'https://www.jds.fr/sports/l-ardechoise-280884_A'
  },
  {
    id: 'haute-route-alps',
    name: 'Haute Route Alps',
    group: 'alpes-nord',
    location: 'Megève → Chambéry',
    period: '17–23 août 2027 (confirmé)',
    editions: [{ year: 2027, date: '2027-08-17', confirmed: true }, { year: 2028, date: '2028-08-15', confirmed: false }],
    distance: '7 jours, cols alpins',
    notes: '',
    link: 'https://hauteroute.fr/'
  },
  {
    id: 'ventoux-denivele',
    name: 'Mont Ventoux Dénivelé Challenges',
    group: 'alpes',
    location: 'Bédoin / Malaucène (Vaucluse)',
    period: 'Début août, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-08-07', confirmed: false }, { year: 2028, date: '2028-08-05', confirmed: false }],
    distance: 'Plusieurs ascensions du Ventoux',
    notes: '',
    link: 'https://www.cyclingnews.com/'
  },
  {
    id: 'gfny-vaujany',
    name: 'GFNY La Vaujany',
    group: 'alpes-nord',
    location: 'Vaujany (Isère)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 21 juin)',
    editions: [{ year: 2027, date: '2027-06-20', confirmed: false }, { year: 2028, date: '2028-06-18', confirmed: false }],
    distance: '130+ km et 60,8 km, via l’Alpe d’Huez',
    notes: '',
    link: 'https://lavaujany.gfny.com/'
  },
  {
    id: 'tour-mont-blanc-cyclo',
    name: 'Tour du Mont Blanc Cyclo',
    group: 'alpes-nord',
    location: 'Hauteluce (Savoie)',
    period: 'Juillet, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-07-18', confirmed: false }, { year: 2028, date: '2028-07-16', confirmed: false }],
    distance: '330 km, 8300 m de dénivelé',
    notes: '',
    link: 'https://fr.milesrepublic.com/'
  },
  {
    id: 'grenobloise',
    name: 'La Grenobloise',
    group: 'alpes-nord',
    location: 'Grenoble (Isère)',
    period: 'Juillet, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-07-04', confirmed: false }, { year: 2028, date: '2028-07-02', confirmed: false }],
    distance: 'Variable',
    notes: '',
    link: 'https://www.finishers.com/'
  },
  {
    id: 'lazarides',
    name: 'La Lazaridès',
    group: 'alpes',
    location: 'Cannes-la-Bocca (Alpes-Maritimes)',
    period: '1er week-end de mai, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-05-01', confirmed: false }, { year: 2028, date: '2028-04-29', confirmed: false }],
    distance: '106 km (1800 m D+) / 157 km (2500 m D+)',
    notes: '',
    link: 'https://lazarides.fr/parcours/'
  },
  {
    id: 'mercantour-bonette',
    name: 'Mercan’Tour Bonette',
    group: 'alpes',
    location: 'Valberg (Alpes-Maritimes)',
    period: 'Mi-juin, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-06-13', confirmed: false }, { year: 2028, date: '2028-06-11', confirmed: false }],
    distance: '80 / 192 km, via le col de la Bonette (2802 m, plus haute route d’Europe)',
    notes: '',
    link: 'https://trainerday.com/fr/events/fr/mercan-tour-bonette'
  },

  // --- Pyrénées ---
  {
    id: 'luchon-ancizan',
    name: 'Luchon-Ancizan (La Lapébie)',
    group: 'pyrenees',
    location: 'Bagnères-de-Luchon (Haute-Garonne)',
    period: 'Été, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-07-04', confirmed: false }, { year: 2028, date: '2028-07-02', confirmed: false }],
    distance: 'Cols pyrénéens',
    notes: '',
    link: 'https://www.hautegaronnetourisme.com/'
  },
  {
    id: 'pyreneenne',
    name: 'La Pyrénéenne',
    group: 'pyrenees',
    location: 'Argelès-Gazost (Hautes-Pyrénées)',
    period: 'Dimanche 4 juillet 2027 (confirmé)',
    editions: [{ year: 2027, date: '2027-07-04', confirmed: true }, { year: 2028, date: '2028-07-02', confirmed: false }],
    distance: '59,6 / 103,8 / 173,2 km (cols du Tourmalet, de l’Aspin, d’Hourquette d’Ancizan selon tracé)',
    notes: '',
    link: 'https://www.valleesdegavarnie.com/agenda/cyclosportive-la-pyreneenne-20eme-edition/'
  },
  {
    id: 'boucles-haut-bearn',
    name: 'Les Boucles du Haut Béarn',
    group: 'pyrenees',
    location: 'Oloron-Sainte-Marie (Pyrénées-Atlantiques)',
    period: 'Fin mai, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-05-30', confirmed: false }, { year: 2028, date: '2028-05-28', confirmed: false }],
    distance: '54,3 km (507 m D+) / 139 km (2702 m D+)',
    notes: '',
    link: 'https://courseproche.fr/evenement/les-boucles-du-haut-bearn'
  },

  // --- Grand Est & Nord ---
  {
    id: 'trois-ballons',
    name: 'Les 3 Ballons',
    group: 'grand-est-nord',
    location: 'Ronchamp (Vosges)',
    period: 'Juin, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-06-13', confirmed: false }, { year: 2028, date: '2028-06-11', confirmed: false }],
    distance: 'Granfondo 183 km / Médiofondo 95 km',
    notes: 'Dénivelé : environ 4000 m (Granfondo) / 2200 m (Médiofondo), à confirmer selon le tracé de l’édition.',
    link: 'https://www.jds.fr/belfort/sports/cyclosportives/3-ballons-santini-281508_A'
  },
  {
    id: 'paris-roubaix-challenge',
    name: 'Paris-Roubaix Challenge',
    group: 'grand-est-nord',
    location: 'Compiègne → Roubaix',
    period: 'Avril, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-04-11', confirmed: false }, { year: 2028, date: '2028-04-09', confirmed: false }],
    distance: '70 / 145 / 170 km, secteurs pavés',
    notes: '',
    link: 'https://www.jds.fr/'
  },
  {
    id: 'sundgauvienne',
    name: 'La Sundgauvienne',
    group: 'grand-est-nord',
    location: 'Hégenheim (Haut-Rhin)',
    period: '2e dimanche de mai, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-05-09', confirmed: false }, { year: 2028, date: '2028-05-07', confirmed: false }],
    distance: '60 km (900 m D+) / 130 km (2000 m D+)',
    notes: 'Accueille aussi les Championnats de France Masters certaines années.',
    link: 'https://www.visit.alsace/242018474-la-sundgauvienne-cyclistes-amateurs-et-confirmes/'
  },
  {
    id: 'chti-bike-tour',
    name: 'Ch’ti Bike Tour',
    group: 'grand-est-nord',
    location: 'Armentières / Lille (Nord)',
    period: 'Dernier week-end d’août, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-08-28', confirmed: false }, { year: 2028, date: '2028-08-26', confirmed: false }],
    distance: '« Alive Challenge » 170 km (2000 m D+) ; « Route des Monts » 60–120 km (500–1400 m D+) + gravel',
    notes: 'Relief limité (Monts de Flandre) : moins montagneux que les autres classiques listées ici.',
    link: 'https://www.lechtibiketour.org/'
  },

  // --- Bretagne & Normandie ---
  {
    id: 'coeur-bretagne',
    name: 'La Cœur de Bretagne',
    group: 'ouest',
    location: 'Malestroit (Morbihan)',
    period: 'Début juillet, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-07-04', confirmed: false }, { year: 2028, date: '2028-07-02', confirmed: false }],
    distance: '135 km (1338 m D+) / 102 km (1030 m D+) ; versions non chronométrées 102/67 km + gravel',
    notes: '',
    link: 'https://lacoeurdebretagne.org/edition-2026/'
  },
  {
    id: 'ronde-normande',
    name: 'La Ronde Normande',
    group: 'ouest',
    location: 'Gouville-sur-Mer (Manche)',
    period: 'Mi-juin, date 2027 non annoncée (épreuve récente, pattern peu établi)',
    editions: [{ year: 2027, date: '2027-06-13', confirmed: false }, { year: 2028, date: '2028-06-11', confirmed: false }],
    distance: 'Distances non précisées par l’organisateur à ce jour',
    notes: '⚠️ Épreuve jeune (2e édition en 2026) : date encore moins fiable que les autres.',
    link: 'https://www.cyclo-larondenormande.fr/la-ronde-normande/'
  },

  // --- Centre & Sud-Ouest ---
  {
    id: 'challenge-centre',
    name: 'Challenge du Centre',
    group: 'idf-centre',
    location: 'Bonneval (Eure-et-Loir)',
    period: 'Mi-septembre, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-09-18', confirmed: false }, { year: 2028, date: '2028-09-16', confirmed: false }],
    distance: 'Route : 30 / 51 / 80 / 102 km (+ VTT/gravel 22/48/70 km)',
    notes: 'Format randonnée cyclo FFVélo (non chronométré) plutôt que cyclosportive pure.',
    link: 'https://centrevaldeloire.ffvelo.fr/challenge-du-centre-2026-a-bonneval-28/'
  },
  {
    id: 'perigordine',
    name: 'La Périgordine',
    group: 'centre-sud-ouest',
    location: 'Le Lardin-Saint-Lazare (Dordogne)',
    period: '3e dimanche de juin, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-06-20', confirmed: false }, { year: 2028, date: '2028-06-18', confirmed: false }],
    distance: '90 / 120 / 150 / 180 km',
    notes: '',
    link: 'https://www.laperigordine.fr/la-p%C3%A9rigordine/les-cyclosportives/'
  },
  {
    id: 'jean-francois-bernard',
    name: 'La Jean-François Bernard',
    group: 'regional',
    location: 'Corbigny (Nièvre), Parc naturel régional du Morvan',
    period: '1er dimanche de septembre, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-09-05', confirmed: false }, { year: 2028, date: '2028-09-03', confirmed: false }],
    distance: '141 / 95 / 62 km (+ 37 km rando non chronométrée)',
    notes: '',
    link: 'https://lajeanfrancoisbernard.fr/en/'
  },

  // --- Occitanie & Corse ---
  {
    id: 'cycl-aigoual',
    name: 'Cycl’Aigoual Région Occitanie',
    group: 'sud-corse',
    location: 'L’Espérou (Gard), massif de l’Aigoual',
    period: 'Dernier samedi de juin, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-06-26', confirmed: false }, { year: 2028, date: '2028-06-24', confirmed: false }],
    distance: '133 km (2500 m D+) / 106 km (1850 m D+)',
    notes: '',
    link: 'https://www.finishers.com/en/event/cycl-aigoual-region-occitanie'
  },
  {
    id: 'lozerienne',
    name: 'La Lozérienne Cyclo',
    group: 'sud-corse',
    location: 'La Canourgue (Lozère)',
    period: 'Début-mi mai, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-05-08', confirmed: false }, { year: 2028, date: '2028-05-06', confirmed: false }],
    distance: '55 km (800 m D+) / 100 km (1900 m D+) / 140 km (2700 m D+)',
    notes: '⚠️ Date d’édition non recoupée sur une deuxième source : à vérifier avant d’ajouter.',
    link: 'https://lozere.fr/agenda/lozerienne-cyclo.html'
  },
  {
    id: 'gf-provence-occitane',
    name: 'GF Provence Occitane (Colnago)',
    group: 'sud-corse',
    location: 'Cornillon (Gard)',
    period: 'Fin avril, date 2027 partiellement annoncée (volet gravel confirmé le 24/04)',
    editions: [{ year: 2027, date: '2027-04-24', confirmed: false }, { year: 2028, date: '2028-04-22', confirmed: false }],
    distance: 'Route : 155 / 113 / 50 km',
    notes: '',
    link: 'https://gfprovenceoccitane.com/'
  },
  {
    id: 'corsica-cyclo',
    name: 'Corsica Cyclo GT20',
    group: 'sud-corse',
    location: 'Bastia → Bonifacio (traversée en 5 étapes)',
    period: 'Début-mi mai, sur 5 jours, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-05-07', confirmed: false }, { year: 2028, date: '2028-05-05', confirmed: false }],
    distance: '~567 km cumulés sur 5 étapes (103,7 / 103 / 113 / 146 / 101 km environ)',
    notes: 'Format multi-jours (5 étapes), différent d’une cyclosportive classique sur une journée.',
    link: 'https://www.visit-corsica.com/fr/Mon-sejour/Manifestations/Toutes-les-manifestations/CORSICA-CYCLO-GT-20'
  },
  // --- Ajouts : calendriers 2026 (finishers, velo-cyclosport, Miles Republic) ---
  {
    id: 'thonon-cycling-race',
    name: 'Thonon Cycling Race',
    group: 'alpes-nord',
    location: 'Thonon-les-Bains (Haute-Savoie)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 3 mai)',
    editions: [{ year: 2027, date: '2027-05-02', confirmed: false }, { year: 2028, date: '2028-04-30', confirmed: false }],
    distance: 'Cyclo 57 km (1110 m D+) / 87 km (1600 m D+) / 109 km (2390 m D+), rando 55 km ; la veille : cyclo 95 km (1000 m D+)',
    notes: 'Week-end vélo des bords du Léman (6e édition en 2026, les 2 et 3 mai). Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Thonon%20Cycling%20Race%20cyclosportive%202027'
  },
  {
    id: 'granfondo-samoens',
    name: 'Granfondo Samoëns',
    group: 'alpes-nord',
    location: 'Samoëns (Haute-Savoie)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 6 juin)',
    editions: [{ year: 2027, date: '2027-06-05', confirmed: false }, { year: 2028, date: '2028-06-03', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Granfondo%20Samo%C3%ABns%20cyclosportive%202027'
  },
  {
    id: 'la-faucigny-glieres',
    name: 'La Faucigny Glières',
    group: 'alpes-nord',
    location: 'Bonneville (Haute-Savoie)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 7 juin)',
    editions: [{ year: 2027, date: '2027-06-06', confirmed: false }, { year: 2028, date: '2028-06-04', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Faucigny%20Gli%C3%A8res%20cyclosportive%202027'
  },
  {
    id: 'la-jpp-neuf-de-c-ur',
    name: 'La JPP · Neuf de Cœur',
    group: 'alpes-nord',
    location: 'Les Carroz-d’Arâches (Haute-Savoie)',
    period: 'Juillet, date 2027 non annoncée (édition 2026 le 5 juillet)',
    editions: [{ year: 2027, date: '2027-07-04', confirmed: false }, { year: 2028, date: '2028-07-02', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20JPP%20%C2%B7%20Neuf%20de%20C%C5%93ur%20cyclosportive%202027'
  },
  {
    id: 'la-chablaisienne',
    name: 'La Chablaisienne',
    group: 'alpes-nord',
    location: 'Allinges (Haute-Savoie)',
    period: 'Août, date 2027 non annoncée (édition 2026 le 15 août)',
    editions: [{ year: 2027, date: '2027-08-14', confirmed: false }, { year: 2028, date: '2028-08-12', confirmed: false }],
    distance: '100 / 82 / 60 / 48 km',
    notes: 'Édition 2026 annoncée en août, jour exact à vérifier. Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Chablaisienne%20cyclosportive%202027'
  },
  {
    id: 'megeve-mont-blanc',
    name: 'Megève Mont-Blanc',
    group: 'alpes-nord',
    location: 'Megève (Haute-Savoie)',
    period: 'Août, date 2027 non annoncée (édition 2026 le 23 août)',
    editions: [{ year: 2027, date: '2027-08-22', confirmed: false }, { year: 2028, date: '2028-08-20', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Meg%C3%A8ve%20Mont-Blanc%20cyclosportive%202027'
  },
  {
    id: 'haute-savoie-mont-blanc-classic-bernard-',
    name: 'Haute-Savoie Mont-Blanc Classic · Bernard Hinault Experience',
    group: 'alpes-nord',
    location: 'Sallanches (Haute-Savoie)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 6 septembre)',
    editions: [{ year: 2027, date: '2027-09-05', confirmed: false }, { year: 2028, date: '2028-09-03', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Haute-Savoie%20Mont-Blanc%20Classic%20%C2%B7%20Bernard%20Hinault%20Experience%20cyclosportive%202027'
  },
  {
    id: 'extrema-cycling-haute-tarentaise',
    name: 'Extrema Cycling Haute-Tarentaise',
    group: 'alpes-nord',
    location: 'Bourg-Saint-Maurice (Savoie)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 20 juin)',
    editions: [{ year: 2027, date: '2027-06-19', confirmed: false }, { year: 2028, date: '2028-06-17', confirmed: false }],
    distance: 'Plusieurs parcours de haute montagne (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Extrema%20Cycling%20Haute-Tarentaise%20cyclosportive%202027'
  },
  {
    id: 'gf-sybelles-la-toussuire',
    name: 'GF Sybelles La Toussuire',
    group: 'alpes-nord',
    location: 'La Toussuire (Savoie)',
    period: 'Juillet, date 2027 non annoncée (édition 2026 le 14 juillet)',
    editions: [{ year: 2027, date: '2027-07-13', confirmed: false }, { year: 2028, date: '2028-07-11', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=GF%20Sybelles%20La%20Toussuire%20cyclosportive%202027'
  },
  {
    id: 'granfondo-col-de-la-loze',
    name: 'Granfondo Col de la Loze',
    group: 'alpes-nord',
    location: 'Brides-les-Bains (Savoie)',
    period: 'Juillet, date 2027 non annoncée (édition 2026 le 19 juillet)',
    editions: [{ year: 2027, date: '2027-07-18', confirmed: false }, { year: 2028, date: '2028-07-16', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Granfondo%20Col%20de%20la%20Loze%20cyclosportive%202027'
  },
  {
    id: 'la-madeleine',
    name: 'La Madeleine',
    group: 'alpes-nord',
    location: 'La Chambre (Savoie)',
    period: 'Juillet, date 2027 non annoncée (édition 2026 le 26 juillet)',
    editions: [{ year: 2027, date: '2027-07-25', confirmed: false }, { year: 2028, date: '2028-07-23', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Madeleine%20cyclosportive%202027'
  },
  {
    id: 'lelex-pays-de-gex',
    name: 'Lélex Pays de Gex',
    group: 'alpes-nord',
    location: 'Lélex (Ain)',
    period: 'Juillet, date 2027 non annoncée (édition 2026 le 26 juillet)',
    editions: [{ year: 2027, date: '2027-07-25', confirmed: false }, { year: 2028, date: '2028-07-23', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=L%C3%A9lex%20Pays%20de%20Gex%20cyclosportive%202027'
  },
  {
    id: 'les-heros',
    name: 'Les Héros',
    group: 'alpes-nord',
    location: 'Saint-Vulbas (Ain)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 5 avril)',
    editions: [{ year: 2027, date: '2027-04-04', confirmed: false }, { year: 2028, date: '2028-04-02', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Les%20H%C3%A9ros%20cyclosportive%202027'
  },
  {
    id: 'le-raid-du-bugey',
    name: 'Le Raid du Bugey',
    group: 'alpes-nord',
    location: 'Lagnieu (Ain)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 26 avril)',
    editions: [{ year: 2027, date: '2027-04-25', confirmed: false }, { year: 2028, date: '2028-04-23', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Le%20Raid%20du%20Bugey%20cyclosportive%202027'
  },
  {
    id: 'l-aindinoise-grand-colombier',
    name: 'L’Aindinoise · Grand Colombier',
    group: 'alpes-nord',
    location: 'Belley (Ain)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 9 mai)',
    editions: [{ year: 2027, date: '2027-05-08', confirmed: false }, { year: 2028, date: '2028-05-06', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=L%E2%80%99Aindinoise%20%C2%B7%20Grand%20Colombier%20cyclosportive%202027'
  },
  {
    id: 'la-bisou',
    name: 'La Bisou',
    group: 'alpes-nord',
    location: 'Péronnas (Ain)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 27 septembre)',
    editions: [{ year: 2027, date: '2027-09-26', confirmed: false }, { year: 2028, date: '2028-09-24', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Bisou%20cyclosportive%202027'
  },
  {
    id: 'la-thierry-claveyrolat',
    name: 'La Thierry Claveyrolat',
    group: 'alpes-nord',
    location: 'Vizille (Isère)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 2 mai)',
    editions: [{ year: 2027, date: '2027-05-01', confirmed: false }, { year: 2028, date: '2028-04-29', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Thierry%20Claveyrolat%20cyclosportive%202027'
  },
  {
    id: 'gfny-villard-de-lans',
    name: 'GFNY Villard-de-Lans',
    group: 'alpes-nord',
    location: 'Villard-de-Lans (Isère)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 24 mai)',
    editions: [{ year: 2027, date: '2027-05-23', confirmed: false }, { year: 2028, date: '2028-05-21', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=GFNY%20Villard-de-Lans%20cyclosportive%202027'
  },
  {
    id: 'la-corima-drome-provencale',
    name: 'La Corima Drôme Provençale',
    group: 'alpes',
    location: 'Montélimar (Drôme)',
    period: 'Mars, date 2027 non annoncée (édition 2026 le 29 mars)',
    editions: [{ year: 2027, date: '2027-03-28', confirmed: false }, { year: 2028, date: '2028-03-26', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Corima%20Dr%C3%B4me%20Proven%C3%A7ale%20cyclosportive%202027'
  },
  {
    id: 'la-rene-privat',
    name: 'La René Privat',
    group: 'alpes',
    location: 'Saint-Sauveur-de-Montagut (Ardèche)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 12 avril)',
    editions: [{ year: 2027, date: '2027-04-11', confirmed: false }, { year: 2028, date: '2028-04-09', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Ren%C3%A9%20Privat%20cyclosportive%202027'
  },
  {
    id: 'les-rondes-de-la-clairette',
    name: 'Les Rondes de la Clairette',
    group: 'alpes',
    location: 'Vercheny (Drôme)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 19 avril)',
    editions: [{ year: 2027, date: '2027-04-18', confirmed: false }, { year: 2028, date: '2028-04-16', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Les%20Rondes%20de%20la%20Clairette%20cyclosportive%202027'
  },
  {
    id: 'les-3-cols',
    name: 'Les 3 Cols',
    group: 'alpes',
    location: 'La Tour-de-Salvagny (Rhône)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 14 mai)',
    editions: [{ year: 2027, date: '2027-05-13', confirmed: false }, { year: 2028, date: '2028-05-11', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Jeudi de l’Ascension en 2026. Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Les%203%20Cols%20cyclosportive%202027'
  },
  {
    id: 'la-dromoise',
    name: 'La Drômoise',
    group: 'alpes',
    location: 'Die (Drôme)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 20 septembre)',
    editions: [{ year: 2027, date: '2027-09-19', confirmed: false }, { year: 2028, date: '2028-09-17', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Dr%C3%B4moise%20cyclosportive%202027'
  },
  {
    id: 'la-mercan-tour-madone-peille',
    name: 'La Mercan’Tour Madone Peille',
    group: 'alpes',
    location: 'Peille (Alpes-Maritimes)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 4 avril)',
    editions: [{ year: 2027, date: '2027-04-03', confirmed: false }, { year: 2028, date: '2028-04-01', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Autre épreuve que la Mercan’Tour Bonette (même organisateur). Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Mercan%E2%80%99Tour%20Madone%20Peille%20cyclosportive%202027'
  },
  {
    id: 'gfny-cannes',
    name: 'GFNY Cannes',
    group: 'alpes',
    location: 'Cannes (Alpes-Maritimes)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 12 avril)',
    editions: [{ year: 2027, date: '2027-04-11', confirmed: false }, { year: 2028, date: '2028-04-09', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=GFNY%20Cannes%20cyclosportive%202027'
  },
  {
    id: 'granfondo-la-vencoise',
    name: 'Granfondo La Vençoise',
    group: 'alpes',
    location: 'Vence (Alpes-Maritimes)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 9 mai)',
    editions: [{ year: 2027, date: '2027-05-08', confirmed: false }, { year: 2028, date: '2028-05-06', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Granfondo%20La%20Ven%C3%A7oise%20cyclosportive%202027'
  },
  {
    id: 'poli-sainte-baume',
    name: 'Poli Sainte-Baume',
    group: 'alpes',
    location: 'La Cadière-d’Azur (Var)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 12 avril)',
    editions: [{ year: 2027, date: '2027-04-11', confirmed: false }, { year: 2028, date: '2028-04-09', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Poli%20Sainte-Baume%20cyclosportive%202027'
  },
  {
    id: 'gf-mont-ventoux',
    name: 'GF Mont Ventoux',
    group: 'alpes',
    location: 'Vaison-la-Romaine (Vaucluse)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 7 juin)',
    editions: [{ year: 2027, date: '2027-06-06', confirmed: false }, { year: 2028, date: '2028-06-04', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=GF%20Mont%20Ventoux%20cyclosportive%202027'
  },
  {
    id: 'la-provencale-cyclo',
    name: 'La Provençale Cyclo',
    group: 'alpes',
    location: 'Manosque (Alpes-de-Haute-Provence)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 27 juin)',
    editions: [{ year: 2027, date: '2027-06-26', confirmed: false }, { year: 2028, date: '2028-06-24', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Proven%C3%A7ale%20Cyclo%20cyclosportive%202027'
  },
  {
    id: 'l-etape-du-tour-femmes',
    name: 'L’Étape du Tour Femmes',
    group: 'alpes',
    location: 'Vaison-la-Romaine (Vaucluse)',
    period: 'Août, date 2027 non annoncée (édition 2026 le 6 août)',
    editions: [{ year: 2027, date: '2027-08-05', confirmed: false }, { year: 2028, date: '2028-08-03', confirmed: false }],
    distance: 'Une étape du Tour de France Femmes (parcours variable selon l’édition)',
    notes: 'Lieu et parcours changent chaque année. Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=L%E2%80%99%C3%89tape%20du%20Tour%20Femmes%20cyclosportive%202027'
  },
  {
    id: 'gf-orcieres',
    name: 'GF Orcières',
    group: 'alpes',
    location: 'Orcières (Hautes-Alpes)',
    period: 'Août, date 2027 non annoncée (édition 2026 le 23 août)',
    editions: [{ year: 2027, date: '2027-08-22', confirmed: false }, { year: 2028, date: '2028-08-20', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=GF%20Orci%C3%A8res%20cyclosportive%202027'
  },
  {
    id: 'alpes-verdon-tour',
    name: 'Alpes Verdon Tour',
    group: 'alpes',
    location: 'Castellane (Alpes-de-Haute-Provence)',
    period: 'Août, date 2027 non annoncée (édition 2026 le 30 août)',
    editions: [{ year: 2027, date: '2027-08-29', confirmed: false }, { year: 2028, date: '2028-08-27', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Alpes%20Verdon%20Tour%20cyclosportive%202027'
  },
  {
    id: 'la-lucien-aimar',
    name: 'La Lucien Aimar',
    group: 'alpes',
    location: 'Hyères (Var)',
    period: 'Août, date 2027 non annoncée (édition 2026 le 30 août)',
    editions: [{ year: 2027, date: '2027-08-29', confirmed: false }, { year: 2028, date: '2028-08-27', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Lucien%20Aimar%20cyclosportive%202027'
  },
  {
    id: 'la-serre-poncon',
    name: 'La Serre-Ponçon',
    group: 'alpes',
    location: 'Savines-le-Lac (Hautes-Alpes)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 13 septembre)',
    editions: [{ year: 2027, date: '2027-09-12', confirmed: false }, { year: 2028, date: '2028-09-10', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Serre-Pon%C3%A7on%20cyclosportive%202027'
  },
  {
    id: 'les-bosses-de-provence',
    name: 'Les Bosses de Provence',
    group: 'alpes',
    location: 'Marseille (Bouches-du-Rhône)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 27 septembre)',
    editions: [{ year: 2027, date: '2027-09-26', confirmed: false }, { year: 2028, date: '2028-09-24', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Les%20Bosses%20de%20Provence%20cyclosportive%202027'
  },
  {
    id: 'gf-luberon-pays-d-apt',
    name: 'GF Luberon Pays d’Apt',
    group: 'alpes',
    location: 'Apt (Vaucluse)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 27 septembre)',
    editions: [{ year: 2027, date: '2027-09-26', confirmed: false }, { year: 2028, date: '2028-09-24', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=GF%20Luberon%20Pays%20d%E2%80%99Apt%20cyclosportive%202027'
  },
  {
    id: 'le-raid-des-alpilles',
    name: 'Le Raid des Alpilles',
    group: 'alpes',
    location: 'Maussane-les-Alpilles (Bouches-du-Rhône)',
    period: 'Octobre, date 2027 non annoncée (édition 2026 le 18 octobre)',
    editions: [{ year: 2027, date: '2027-10-17', confirmed: false }, { year: 2028, date: '2028-10-15', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Le%20Raid%20des%20Alpilles%20cyclosportive%202027'
  },
  {
    id: 'cyclomontagnarde-des-volcans',
    name: 'Cyclomontagnarde des Volcans',
    group: 'massif-central',
    location: 'Mozac (Puy-de-Dôme)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 30 mai)',
    editions: [{ year: 2027, date: '2027-05-29', confirmed: false }, { year: 2028, date: '2028-05-27', confirmed: false }],
    distance: '230 km (4 400 m D+) sur deux jours (randonnée FFCT)',
    notes: 'Randonnée « cyclomontagnarde », sans classement, les 30 et 31 mai 2026. Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Cyclomontagnarde%20des%20Volcans%20cyclosportive%202027'
  },
  {
    id: 'la-limousine-andre-dufraisse',
    name: 'La Limousine André Dufraisse',
    group: 'massif-central',
    location: 'Panazol (Haute-Vienne)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 6 juin)',
    editions: [{ year: 2027, date: '2027-06-05', confirmed: false }, { year: 2028, date: '2028-06-03', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Limousine%20Andr%C3%A9%20Dufraisse%20cyclosportive%202027'
  },
  {
    id: 'la-volcane',
    name: 'La Volcane',
    group: 'massif-central',
    location: 'Volvic (Puy-de-Dôme)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 21 juin)',
    editions: [{ year: 2027, date: '2027-06-20', confirmed: false }, { year: 2028, date: '2028-06-18', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Volcane%20cyclosportive%202027'
  },
  {
    id: 'l-etape-sanfloraine',
    name: 'L’Étape Sanfloraine',
    group: 'massif-central',
    location: 'Saint-Flour (Cantal)',
    period: 'Août, date 2027 non annoncée (édition 2026 le 9 août)',
    editions: [{ year: 2027, date: '2027-08-08', confirmed: false }, { year: 2028, date: '2028-08-06', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=L%E2%80%99%C3%89tape%20Sanfloraine%20cyclosportive%202027'
  },
  {
    id: 'la-cyclo-au-c-ur-de-la-loire',
    name: 'La Cyclo au cœur de la Loire',
    group: 'massif-central',
    location: 'Saint-Just-en-Chevalet (Loire)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 6 septembre)',
    editions: [{ year: 2027, date: '2027-09-05', confirmed: false }, { year: 2028, date: '2028-09-03', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Cyclo%20au%20c%C5%93ur%20de%20la%20Loire%20cyclosportive%202027'
  },
  {
    id: 'la-sancy-arc-en-ciel-by-laurent-brochard',
    name: 'La Sancy Arc-en-Ciel by Laurent Brochard',
    group: 'massif-central',
    location: 'Chambon-sur-Lac (Puy-de-Dôme)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 13 septembre)',
    editions: [{ year: 2027, date: '2027-09-12', confirmed: false }, { year: 2028, date: '2028-09-10', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Les sources 2026 hésitent entre le 12 et le 13 septembre. Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Sancy%20Arc-en-Ciel%20by%20Laurent%20Brochard%20cyclosportive%202027'
  },
  {
    id: 'cyclo-sud-bourgogne',
    name: 'Cyclo Sud Bourgogne',
    group: 'regional',
    location: 'Viré (Saône-et-Loire)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 25 avril)',
    editions: [{ year: 2027, date: '2027-04-24', confirmed: false }, { year: 2028, date: '2028-04-22', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Cyclo%20Sud%20Bourgogne%20cyclosportive%202027'
  },
  {
    id: 'la-bernard-thevenet',
    name: 'La Bernard Thévenet',
    group: 'regional',
    location: 'Vitry-en-Charollais (Saône-et-Loire)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 30 mai)',
    editions: [{ year: 2027, date: '2027-05-29', confirmed: false }, { year: 2028, date: '2028-05-27', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Bernard%20Th%C3%A9venet%20cyclosportive%202027'
  },
  {
    id: 'la-claudio-chiappucci',
    name: 'La Claudio Chiappucci',
    group: 'regional',
    location: 'Arnay-le-Duc (Côte-d’Or)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 6 juin)',
    editions: [{ year: 2027, date: '2027-06-05', confirmed: false }, { year: 2028, date: '2028-06-03', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Claudio%20Chiappucci%20cyclosportive%202027'
  },
  {
    id: 'la-juradorienne',
    name: 'La Juradorienne',
    group: 'regional',
    location: 'Dole (Jura)',
    period: 'Août, date 2027 non annoncée (édition 2026 le 1er août)',
    editions: [{ year: 2027, date: '2027-07-31', confirmed: false }, { year: 2028, date: '2028-07-29', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Juradorienne%20cyclosportive%202027'
  },
  {
    id: 'la-route-thermale',
    name: 'La Route Thermale',
    group: 'grand-est-nord',
    location: 'Vittel (Vosges)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 1er mai)',
    editions: [{ year: 2027, date: '2027-04-30', confirmed: false }, { year: 2028, date: '2028-04-28', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Route%20Thermale%20cyclosportive%202027'
  },
  {
    id: 'la-route-verte',
    name: 'La Route Verte',
    group: 'grand-est-nord',
    location: 'Épinal (Vosges)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 3 mai)',
    editions: [{ year: 2027, date: '2027-05-02', confirmed: false }, { year: 2028, date: '2028-04-30', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Route%20Verte%20cyclosportive%202027'
  },
  {
    id: 'uci-granfondo-vosges',
    name: 'UCI Granfondo Vosges',
    group: 'grand-est-nord',
    location: 'La Bresse (Vosges)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 17 mai)',
    editions: [{ year: 2027, date: '2027-05-16', confirmed: false }, { year: 2028, date: '2028-05-14', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Qualificative pour les championnats du monde UCI Gran Fondo. Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=UCI%20Granfondo%20Vosges%20cyclosportive%202027'
  },
  {
    id: 'bar-sur-aube-chemins-blancs-cycling-race',
    name: 'Bar-sur-Aube Chemins Blancs Cycling Race',
    group: 'grand-est-nord',
    location: 'Bar-sur-Aube (Aube)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 21 juin)',
    editions: [{ year: 2027, date: '2027-06-20', confirmed: false }, { year: 2028, date: '2028-06-18', confirmed: false }],
    distance: 'Plusieurs parcours, avec portions de chemins blancs (voir site)',
    notes: 'Comporte des secteurs non goudronnés. Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Bar-sur-Aube%20Chemins%20Blancs%20Cycling%20Race%20cyclosportive%202027'
  },
  {
    id: 'cyclomontagnarde-vosges-alsace',
    name: 'CycloMontagnarde Vosges Alsace',
    group: 'grand-est-nord',
    location: 'Wihr-au-Val (Haut-Rhin)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 27 juin)',
    editions: [{ year: 2027, date: '2027-06-26', confirmed: false }, { year: 2028, date: '2028-06-24', confirmed: false }],
    distance: '204 km (4 210 m D+) / 106 km (1 890 m D+) / 76 km (1 270 m D+)',
    notes: 'Randonnée sur deux jours (27-28 juin 2026). Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=CycloMontagnarde%20Vosges%20Alsace%20cyclosportive%202027'
  },
  {
    id: 'l-alsacienne',
    name: 'L’Alsacienne',
    group: 'grand-est-nord',
    location: 'Lac de Kruth-Wildenstein (Haut-Rhin)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 28 juin)',
    editions: [{ year: 2027, date: '2027-06-27', confirmed: false }, { year: 2028, date: '2028-06-25', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=L%E2%80%99Alsacienne%20cyclosportive%202027'
  },
  {
    id: 'gfny-grand-ballon',
    name: 'GFNY Grand Ballon',
    group: 'grand-est-nord',
    location: 'Thann (Haut-Rhin)',
    period: 'Juillet, date 2027 non annoncée (édition 2026 le 12 juillet)',
    editions: [{ year: 2027, date: '2027-07-11', confirmed: false }, { year: 2028, date: '2028-07-09', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=GFNY%20Grand%20Ballon%20cyclosportive%202027'
  },
  {
    id: 'la-neodomienne-cyclo',
    name: 'La Néodomienne Cyclo',
    group: 'grand-est-nord',
    location: 'Neuves-Maisons (Meurthe-et-Moselle)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 13 septembre)',
    editions: [{ year: 2027, date: '2027-09-12', confirmed: false }, { year: 2028, date: '2028-09-10', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20N%C3%A9odomienne%20Cyclo%20cyclosportive%202027'
  },
  {
    id: 'la-mirabelle-cyclo',
    name: 'La Mirabelle Cyclo',
    group: 'grand-est-nord',
    location: 'Damelevières (Meurthe-et-Moselle)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 27 septembre)',
    editions: [{ year: 2027, date: '2027-09-26', confirmed: false }, { year: 2028, date: '2028-09-24', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Mirabelle%20Cyclo%20cyclosportive%202027'
  },
  {
    id: '66-degres-sud',
    name: '66 Degrés Sud',
    group: 'pyrenees',
    location: 'Canet-en-Roussillon (Pyrénées-Orientales)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 25 avril)',
    editions: [{ year: 2027, date: '2027-04-24', confirmed: false }, { year: 2028, date: '2028-04-22', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=66%20Degr%C3%A9s%20Sud%20cyclosportive%202027'
  },
  {
    id: 'euskal-cyclo',
    name: 'Euskal Cyclo',
    group: 'pyrenees',
    location: 'Cambo-les-Bains (Pyrénées-Atlantiques)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 10 mai)',
    editions: [{ year: 2027, date: '2027-05-09', confirmed: false }, { year: 2028, date: '2028-05-07', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Euskal%20Cyclo%20cyclosportive%202027'
  },
  {
    id: 'la-bizikleta',
    name: 'La Bizikleta',
    group: 'pyrenees',
    location: 'Saint-Jean-de-Luz (Pyrénées-Atlantiques)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 24 mai)',
    editions: [{ year: 2027, date: '2027-05-23', confirmed: false }, { year: 2028, date: '2028-05-21', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Bizikleta%20cyclosportive%202027'
  },
  {
    id: 'gfny-lourdes-tourmalet',
    name: 'GFNY Lourdes Tourmalet',
    group: 'pyrenees',
    location: 'Lourdes (Hautes-Pyrénées)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 14 juin)',
    editions: [{ year: 2027, date: '2027-06-13', confirmed: false }, { year: 2028, date: '2028-06-11', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=GFNY%20Lourdes%20Tourmalet%20cyclosportive%202027'
  },
  {
    id: 'l-ariegeoise',
    name: 'L’Ariégeoise',
    group: 'pyrenees',
    location: 'Tarascon-sur-Ariège (Ariège)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 27 juin)',
    editions: [{ year: 2027, date: '2027-06-26', confirmed: false }, { year: 2028, date: '2028-06-24', confirmed: false }],
    distance: '169 km (plus de 4 000 m D+) / 117 / 82 / 66 km',
    notes: '30e édition en 2026 (26-28 juin) : Port de Lers, col d’Agnès, Plateau de Beille. Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=L%E2%80%99Ari%C3%A9geoise%20cyclosportive%202027'
  },
  {
    id: 'baztan-race',
    name: 'Baztan Race',
    group: 'pyrenees',
    location: 'Bayonne (Pyrénées-Atlantiques)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 13 septembre)',
    editions: [{ year: 2027, date: '2027-09-12', confirmed: false }, { year: 2028, date: '2028-09-10', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Baztan%20Race%20cyclosportive%202027'
  },
  {
    id: 'la-montagnacoise',
    name: 'La Montagnacoise',
    group: 'sud-corse',
    location: 'Montagnac (Hérault)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 5 avril)',
    editions: [{ year: 2027, date: '2027-04-04', confirmed: false }, { year: 2028, date: '2028-04-02', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Montagnacoise%20cyclosportive%202027'
  },
  {
    id: 'la-laurent-jalabert',
    name: 'La Laurent Jalabert',
    group: 'sud-corse',
    location: 'Mazamet (Tarn)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 20 septembre)',
    editions: [{ year: 2027, date: '2027-09-19', confirmed: false }, { year: 2028, date: '2028-09-17', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Laurent%20Jalabert%20cyclosportive%202027'
  },
  {
    id: 'la-castraise',
    name: 'La Castraise',
    group: 'sud-corse',
    location: 'Castres (Tarn)',
    period: 'Octobre, date 2027 non annoncée (édition 2026 le 18 octobre)',
    editions: [{ year: 2027, date: '2027-10-17', confirmed: false }, { year: 2028, date: '2028-10-15', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Castraise%20cyclosportive%202027'
  },
  {
    id: 'la-beuchigue',
    name: 'La Beuchigue',
    group: 'centre-sud-ouest',
    location: 'Saint-Sever (Landes)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 5 avril)',
    editions: [{ year: 2027, date: '2027-04-04', confirmed: false }, { year: 2028, date: '2028-04-02', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Beuchigue%20cyclosportive%202027'
  },
  {
    id: 'defi-47',
    name: 'Défi 47',
    group: 'centre-sud-ouest',
    location: 'Prayssas (Lot-et-Garonne)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 12 avril)',
    editions: [{ year: 2027, date: '2027-04-11', confirmed: false }, { year: 2028, date: '2028-04-09', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=D%C3%A9fi%2047%20cyclosportive%202027'
  },
  {
    id: 'la-vendeenne',
    name: 'La Vendéenne',
    group: 'ouest',
    location: 'Saint-Mars-la-Réorthe (Vendée)',
    period: 'Mars, date 2027 non annoncée (édition 2026 le 28 mars)',
    editions: [{ year: 2027, date: '2027-03-27', confirmed: false }, { year: 2028, date: '2028-03-25', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Vend%C3%A9enne%20cyclosportive%202027'
  },
  {
    id: 'cyclosportive-babybel',
    name: 'Cyclosportive Babybel',
    group: 'ouest',
    location: 'Évron (Mayenne)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 3 mai)',
    editions: [{ year: 2027, date: '2027-05-02', confirmed: false }, { year: 2028, date: '2028-04-30', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Cyclosportive%20Babybel%20cyclosportive%202027'
  },
  {
    id: 'l-ornaise',
    name: 'L’Ornaise',
    group: 'ouest',
    location: 'Argentan (Orne)',
    period: 'Mai, date 2027 non annoncée (édition 2026 le 10 mai)',
    editions: [{ year: 2027, date: '2027-05-09', confirmed: false }, { year: 2028, date: '2028-05-07', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=L%E2%80%99Ornaise%20cyclosportive%202027'
  },
  {
    id: 'les-bosses-vernonnaises',
    name: 'Les Bosses Vernonnaises',
    group: 'ouest',
    location: 'Vernon (Eure)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 21 juin)',
    editions: [{ year: 2027, date: '2027-06-20', confirmed: false }, { year: 2028, date: '2028-06-18', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Les%20Bosses%20Vernonnaises%20cyclosportive%202027'
  },
  {
    id: 'la-jacques-gouin',
    name: 'La Jacques Gouin',
    group: 'idf-centre',
    location: 'Mennecy (Essonne)',
    period: 'Mars, date 2027 non annoncée (édition 2026 le 1er mars)',
    editions: [{ year: 2027, date: '2027-02-28', confirmed: false }, { year: 2028, date: '2028-02-27', confirmed: false }],
    distance: '115 km (930 m D+) et parcours plus courts',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Jacques%20Gouin%20cyclosportive%202027'
  },
  {
    id: 'la-pakavelo-sud-77',
    name: 'La Pakavélo Sud 77',
    group: 'idf-centre',
    location: 'Paley (Seine-et-Marne)',
    period: 'Avril, date 2027 non annoncée (édition 2026 le 5 avril)',
    editions: [{ year: 2027, date: '2027-04-04', confirmed: false }, { year: 2028, date: '2028-04-02', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=La%20Pakav%C3%A9lo%20Sud%2077%20cyclosportive%202027'
  },
  {
    id: 'le-bocage-gatinais',
    name: 'Le Bocage Gâtinais',
    group: 'idf-centre',
    location: 'Égreville (Seine-et-Marne)',
    period: 'Septembre, date 2027 non annoncée (édition 2026 le 27 septembre)',
    editions: [{ year: 2027, date: '2027-09-26', confirmed: false }, { year: 2028, date: '2028-09-24', confirmed: false }],
    distance: 'Plusieurs parcours (voir site)',
    notes: 'Ajoutée d’après les calendriers 2026 (finishers, velo-cyclosport, Miles Republic) : date 2027 estimée au même jour de la semaine.',
    link: 'https://www.google.com/search?q=Le%20Bocage%20G%C3%A2tinais%20cyclosportive%202027'
  }
];

export const RACE_GROUPS = [
  { id: 'regional', label: 'Bourgogne-Franche-Comté' },
  { id: 'alpes-nord', label: 'Savoie, Haute-Savoie, Isère & Ain' },
  { id: 'alpes', label: 'Provence, Alpes du Sud, Drôme & Ardèche' },
  { id: 'massif-central', label: 'Auvergne & Massif central' },
  { id: 'pyrenees', label: 'Pyrénées' },
  { id: 'grand-est-nord', label: 'Grand Est & Nord' },
  { id: 'ouest', label: 'Ouest (Bretagne, Normandie, Pays de la Loire)' },
  { id: 'idf-centre', label: 'Île-de-France & Centre' },
  { id: 'centre-sud-ouest', label: 'Nouvelle-Aquitaine' },
  { id: 'sud-corse', label: 'Occitanie & Corse' }
];
