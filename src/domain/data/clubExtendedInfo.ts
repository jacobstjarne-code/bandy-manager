export interface ClubExtendedInfo {
  clubId: string
  arenaNote: string
  patronType: string
  klimateArchetype: string
  briefDescription: string
}

export const CLUB_EXTENDED_INFO: Record<string, ClubExtendedInfo> = {
  'club_forsbacka': {
    clubId: 'club_forsbacka',
    arenaNote: 'Naturis bäddad bland furor. Köldhål vid sjön.',
    patronType: 'Bruksdisponent',
    klimateArchetype: 'bruk_lakeside',
    briefDescription: 'Bruksort i skogslandskap vid Storsjöns utlopp. Klämd mellan stadsklubbarnas skuggor — men när isen ligger är det magiskt.',
  },
  'club_soderfors': {
    clubId: 'club_soderfors',
    arenaNote: 'Bruksort på ö i älven. Tidig is på smala armar.',
    patronType: 'Brukschef',
    klimateArchetype: 'bruk_river_island',
    briefDescription: 'Ankarsmedjan vid Dalälven. Vägen till plan går alltid över en bro.',
  },
  'club_vastanfors': {
    clubId: 'club_vastanfors',
    arenaNote: 'Landets äldsta landbana. Konstfrusen sedan 1935.',
    patronType: 'Stålindustrins representant',
    klimateArchetype: 'bruk_lakeside',
    briefDescription: 'Bergslagen i ryggen. Konstfrusen bana sedan decennier — bandyn lever kvar när stål och gruva tystnat.',
  },
  'club_karlsborg': {
    clubId: 'club_karlsborg',
    arenaNote: 'Vid pappersbruket nära älvmynningen. Sopas ofta.',
    patronType: 'Pappersbrukets fackordförande',
    klimateArchetype: 'arctic_coast',
    briefDescription: 'Längst norrut i bandysverige. Mörker och köld är vardag — men isen är alltid förberedd.',
  },
  'club_malilla': {
    clubId: 'club_malilla',
    arenaNote: 'Konstfrusen sedan 1934. En av landets äldsta banor.',
    patronType: 'Kommunens näringsliv',
    klimateArchetype: 'sm_highland_extreme',
    briefDescription: 'Småländska höglandet med extrema temperaturer. Termometern på torget mäter allt — och klacken är alltid här.',
  },
  'club_gagnef': {
    clubId: 'club_gagnef',
    arenaNote: 'Vid älvkanten i Dalälvens sammanlöp.',
    patronType: 'Ortens hantverksmästare',
    klimateArchetype: 'valley_inland',
    briefDescription: 'Dalabygd där älvarna möts. Skidor och skridskors-kultur sida vid sida — bandyn måste kämpa för uppmärksamheten.',
  },
  'club_halleforsnas': {
    clubId: 'club_halleforsnas',
    arenaNote: 'Naturis vid brukssjön. Konstfrusen väntar fortfarande.',
    patronType: 'Järnbrukets fackstark',
    klimateArchetype: 'bruk_lakeside',
    briefDescription: 'Sörmländsk bruksort vid Hälleforsen. Bandyn hålls levande av stolt tradition och järnets folk.',
  },
  'club_lesjofors': {
    clubId: 'club_lesjofors',
    arenaNote: 'Naturis sedan 1967. Köldhål i dalgången.',
    patronType: 'Fjäderfabrikens skiftarbetare',
    klimateArchetype: 'valley_coldpit',
    briefDescription: 'Värmlands köldhål — temperaturen sjunker extra när högtrycket sätter in. Fostrat storspelare men förblir ett byalag.',
  },
  'club_rogle': {
    clubId: 'club_rogle',
    arenaNote: 'Konstfrusen obligatorisk. Salt havsluft från Kattegatt.',
    patronType: 'Kustnäringens eldsjäl',
    klimateArchetype: 'scanian_coast',
    briefDescription: 'Sydligast i bandysverige. Konstfrusen är allt — naturis räknar de inte med. Underdog i ett hockeylandskap.',
  },
  'club_slottsbron': {
    clubId: 'club_slottsbron',
    arenaNote: 'Vid Vänerns strand. Sen istäcke, dimma, storm.',
    patronType: 'Sulfitbrukets veteranarbetare',
    klimateArchetype: 'vanern_effect',
    briefDescription: 'Bruksort vid Vänern. Sjön fördröjer isen men ger också storarna av stämning när vädret vänder.',
  },
  'club_skutskar': {
    clubId: 'club_skutskar',
    arenaNote: 'Konstfrusen sedan 1961 — byggd utan kommunal insats.',
    patronType: 'Pappersbrukets skiftarbetare',
    klimateArchetype: 'gulf_coast',
    briefDescription: 'Vid Dalälvens mynning i Bottenhavet. Stolt brukshistoria och en bandybana klubben byggt med egna händer.',
  },
  'club_heros': {
    clubId: 'club_heros',
    arenaNote: 'Konstfrusen vid Norra Barkens strand.',
    patronType: 'Stålindustrins hantverkare',
    klimateArchetype: 'bruk_lakeside',
    briefDescription: 'Smedjebacken i södra Dalarna. Sjön ger dimma och fuktig luft — men banan håller och Norra Barken är alltid ett blickfång.',
  },
}
