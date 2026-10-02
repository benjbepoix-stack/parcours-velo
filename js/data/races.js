/*
 * Cyclosportives : sélection curatée et mise à jour à la main (pas de flux
 * en direct), régionale (Franche-Comté / Jura) et grandes classiques
 * nationales. La plupart des dates précises 2027 ne sont pas encore
 * annoncées début octobre 2026 : `date` est une estimation à partir des
 * éditions précédentes, à vérifier et corriger avant d'ajouter la course
 * au planning — le champ reste modifiable.
 */
export const RACES = [
  // --- Régional : Franche-Comté / Jura ---
  {
    id: 'bisontine',
    name: 'La Bisontine',
    group: 'regional',
    location: 'Besançon (Doubs)',
    period: 'Mai, date 2027 non annoncée',
    date: '2027-05-16',
    confirmed: false,
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
    date: '2027-06-19',
    confirmed: false,
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
    date: '2027-06-06',
    confirmed: false,
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
    date: '2027-09-12',
    confirmed: false,
    distance: '13 et 8,5 km (format local, dénivelé concentré)',
    notes: '',
    link: 'https://fr.milesrepublic.com/cyclotourisme/doubs'
  },

  // --- Grandes classiques nationales ---
  {
    id: 'etape-du-tour',
    name: 'L’Étape du Tour',
    group: 'national',
    location: 'Alpes (parcours variable selon l’édition)',
    period: 'Mi-juillet 2027, parcours non annoncé',
    date: '2027-07-11',
    confirmed: false,
    distance: 'Variable selon l’édition',
    notes: '',
    link: 'https://www.jds.fr/'
  },
  {
    id: 'marmotte-granfondo',
    name: 'La Marmotte Granfondo Alpes',
    group: 'national',
    location: 'Bourg-d’Oisans (Isère)',
    period: '27 juin 2027 (confirmé)',
    date: '2027-06-27',
    confirmed: true,
    distance: 'Plusieurs distances, cols alpins',
    notes: '',
    link: 'https://www.intervalcoach.app/'
  },
  {
    id: 'ardechoise',
    name: 'L’Ardéchoise',
    group: 'national',
    location: 'Saint-Félicien (Ardèche)',
    period: '8–12 juin 2027 (confirmé, plusieurs jours)',
    date: '2027-06-08',
    confirmed: true,
    distance: '67 à 285 km selon le parcours (7 formules à la journée + formules 2–4 jours)',
    notes: 'Semaine à plusieurs formules : choisir le jour/parcours avant d’ajouter.',
    link: 'https://www.jds.fr/sports/l-ardechoise-280884_A'
  },
  {
    id: 'haute-route-alps',
    name: 'Haute Route Alps',
    group: 'national',
    location: 'Megève → Chambéry',
    period: '17–23 août 2027 (confirmé)',
    date: '2027-08-17',
    confirmed: true,
    distance: '7 jours, cols alpins',
    notes: '',
    link: 'https://hauteroute.fr/'
  },
  {
    id: 'paris-roubaix-challenge',
    name: 'Paris-Roubaix Challenge',
    group: 'national',
    location: 'Compiègne → Roubaix',
    period: 'Avril, date 2027 non annoncée',
    date: '2027-04-11',
    confirmed: false,
    distance: '70 / 145 / 170 km, secteurs pavés',
    notes: '',
    link: 'https://www.jds.fr/'
  },
  {
    id: 'ventoux-denivele',
    name: 'Mont Ventoux Dénivelé Challenges',
    group: 'national',
    location: 'Bédoin / Malaucène (Vaucluse)',
    period: 'Début août, date 2027 non annoncée',
    date: '2027-08-07',
    confirmed: false,
    distance: 'Plusieurs ascensions du Ventoux',
    notes: '',
    link: 'https://www.cyclingnews.com/'
  },
  {
    id: 'trois-ballons',
    name: 'Les 3 Ballons',
    group: 'national',
    location: 'Ronchamp (Vosges)',
    period: 'Juin, date 2027 non annoncée',
    date: '2027-06-13',
    confirmed: false,
    distance: 'Granfondo 178 km / Médiofondo 93 km',
    notes: 'Dénivelé : 4020 m (Granfondo) / 2200 m (Médiofondo).',
    link: 'https://www.jds.fr/belfort/sports/cyclosportives/3-ballons-santini-281508_A'
  },
  {
    id: 'luchon-ancizan',
    name: 'Luchon-Ancizan (La Lapébie)',
    group: 'national',
    location: 'Bagnères-de-Luchon (Pyrénées)',
    period: 'Été, date 2027 non annoncée',
    date: '2027-07-04',
    confirmed: false,
    distance: 'Cols pyrénéens',
    notes: '',
    link: 'https://www.hautegaronnetourisme.com/'
  },
  {
    id: 'gfny-vaujany',
    name: 'GFNY La Vaujany',
    group: 'national',
    location: 'Vaujany (Isère)',
    period: 'Juin, date 2027 non annoncée (édition 2026 le 21 juin)',
    date: '2027-06-20',
    confirmed: false,
    distance: '130+ km et 60,8 km, via l’Alpe d’Huez',
    notes: '',
    link: 'https://lavaujany.gfny.com/'
  },
  {
    id: 'tour-mont-blanc-cyclo',
    name: 'Tour du Mont Blanc Cyclo',
    group: 'national',
    location: 'Hauteluce (Savoie)',
    period: 'Juillet, date 2027 non annoncée',
    date: '2027-07-18',
    confirmed: false,
    distance: '330 km, 8300 m de dénivelé',
    notes: '',
    link: 'https://fr.milesrepublic.com/'
  },
  {
    id: 'grenobloise',
    name: 'La Grenobloise',
    group: 'national',
    location: 'Grenoble (Isère)',
    period: 'Juillet, date 2027 non annoncée',
    date: '2027-07-04',
    confirmed: false,
    distance: 'Variable',
    notes: '',
    link: 'https://www.finishers.com/'
  }
];

export const RACE_GROUPS = [
  { id: 'regional', label: 'Franche-Comté / Jura' },
  { id: 'national', label: 'Grandes classiques' }
];
