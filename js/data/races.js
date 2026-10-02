/*
 * Cyclosportives : sélection curatée et mise à jour à la main (pas de flux
 * en direct), couvrant désormais la France entière (régionale Franche-
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
    name: 'La Bisontine',
    group: 'regional',
    location: 'Besançon (Doubs)',
    period: 'Mai, date 2027 non annoncée',
    editions: [{ year: 2027, date: '2027-05-16', confirmed: false }, { year: 2028, date: '2028-05-14', confirmed: false }],
    distance: '132 / 103 / 80 / 76 / 49 km',
    notes: '',
    link: 'https://fr.milesrepublic.com/cyclotourisme/doubs'
  },
  {
    id: 'cyclomontagnarde-jura',
    name: 'La Cyclomontagnarde du Jura',
    group: 'regional',
    location: 'Montmorot / Lons-le-Saunier (Jura)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 20 juin)',
    editions: [{ year: 2027, date: '2027-06-19', confirmed: false }, { year: 2028, date: '2028-06-17', confirmed: false }],
    distance: 'Plusieurs distances cyclo',
    notes: '',
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

  // --- Alpes & Provence ---
  {
    id: 'etape-du-tour',
    name: 'L’Étape du Tour',
    group: 'alpes',
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
    group: 'alpes',
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
    group: 'alpes',
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
    group: 'alpes',
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
    group: 'alpes',
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
    group: 'alpes',
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
    distance: 'Granfondo 178 km / Médiofondo 93 km',
    notes: 'Dénivelé : 4020 m (Granfondo) / 2200 m (Médiofondo).',
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
    group: 'centre-sud-ouest',
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
    group: 'centre-sud-ouest',
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
  }
];

export const RACE_GROUPS = [
  { id: 'regional', label: 'Franche-Comté / Jura' },
  { id: 'alpes', label: 'Alpes & Provence' },
  { id: 'pyrenees', label: 'Pyrénées' },
  { id: 'grand-est-nord', label: 'Grand Est & Nord' },
  { id: 'ouest', label: 'Bretagne & Normandie' },
  { id: 'centre-sud-ouest', label: 'Centre & Sud-Ouest' },
  { id: 'sud-corse', label: 'Occitanie & Corse' }
];
