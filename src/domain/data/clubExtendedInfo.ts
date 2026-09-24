/**
 * B3 (BANDYSPRAK_KALLASNING_2026-08-19.md) — Jacobs dom 2026-08-19, alla
 * tolv dömda. Princip: pålitlig is (konstfrusen, gammal tradition) ger
 * tränade passningsmönster → spelande. Åkande lag bygger i stället sin
 * identitet på fart, individuell bolltransport och rakare anfall. Det är
 * klubbarnas träningskultur, inte dagens kylsystem — korrelerar
 * avsiktligt inte med tabellplacering (Brodéns egen poäng). De två
 * SVÅR-klassade klubbarna (U1s difficulty-modell) hamnar medvetet på
 * var sitt håll: Skutskär spelande, Slottsbron åkande.
 */
export type PlayStyleTradition = 'spelande' | 'akande'

export interface ClubExtendedInfo {
  clubId: string
  arenaNote: string
  patronType: string
  klimateArchetype: string
  briefDescription: string
  playStyleTradition?: PlayStyleTradition
}

export const CLUB_EXTENDED_INFO: Record<string, ClubExtendedInfo> = {
  'club_forsbacka': {
    clubId: 'club_forsbacka',
    arenaNote: 'Konstfrusen is inbäddad bland furor. Köldhål vid sjön.',
    patronType: 'Bruksdisponent',
    klimateArchetype: 'bruk_lakeside',
    briefDescription: 'Bruksort i skogslandskap vid Storsjöns utlopp. Klämd mellan stadsklubbarnas skuggor — men på matchkvällar är det magiskt.',
    playStyleTradition: 'akande',
  },
  'club_soderfors': {
    clubId: 'club_soderfors',
    arenaNote: 'Konstfrusen bana på ön i älven. Vägen dit går över bron.',
    patronType: 'Brukschef',
    klimateArchetype: 'bruk_river_island',
    briefDescription: 'Ankarsmedjan vid Dalälven. Vägen till plan går alltid över en bro.',
    playStyleTradition: 'spelande',
  },
  'club_vastanfors': {
    clubId: 'club_vastanfors',
    arenaNote: 'Landets äldsta landbana. Konstfrusen sedan 1935.',
    patronType: 'Stålindustrins representant',
    klimateArchetype: 'bruk_lakeside',
    briefDescription: 'Bergslagen i ryggen. Konstfrusen bana sedan decennier — bandyn lever kvar när stål och gruva tystnat.',
    playStyleTradition: 'spelande',
  },
  'club_karlsborg': {
    clubId: 'club_karlsborg',
    arenaNote: 'Vid pappersbruket nära älvmynningen. Spolas ofta.',
    patronType: 'Pappersbrukets fackordförande',
    klimateArchetype: 'arctic_coast',
    briefDescription: 'Längst norrut i bandysverige. Mörker och köld är vardag — men isen är alltid förberedd.',
    playStyleTradition: 'akande',
  },
  'club_malilla': {
    clubId: 'club_malilla',
    arenaNote: 'Konstfrusen sedan 1934. En av landets äldsta planer.',
    patronType: 'Kommunens näringsliv',
    klimateArchetype: 'sm_highland_extreme',
    briefDescription: 'Småländska höglandet med extrema temperaturer. Termometern på torget mäter allt — och klacken är alltid här.',
    playStyleTradition: 'spelande',
  },
  'club_gagnef': {
    clubId: 'club_gagnef',
    arenaNote: 'Vid älvkanten i Dalälvens sammanlöp.',
    patronType: 'Ortens hantverksmästare',
    klimateArchetype: 'valley_inland',
    briefDescription: 'Dalabygd där älvarna möts. Skid- och skridskokultur sida vid sida — bandyn måste kämpa för uppmärksamheten.',
    playStyleTradition: 'spelande',
  },
  'club_halleforsnas': {
    clubId: 'club_halleforsnas',
    arenaNote: 'Konstfrusen is vid brukssjön. Bruksortens mötesplats vintertid.',
    patronType: 'Brukets tidigare fackordförande',
    klimateArchetype: 'bruk_lakeside',
    briefDescription: 'Sörmländsk bruksort vid Hälleforsen. Bandyn hålls levande av stolt tradition och järnets folk.',
    playStyleTradition: 'akande',
  },
  'club_lesjofors': {
    clubId: 'club_lesjofors',
    arenaNote: 'Konstfrusen is i dalgångens köldhål.',
    patronType: 'Fjäderfabrikens skiftarbetare',
    klimateArchetype: 'valley_coldpit',
    briefDescription: 'Värmlands köldhål — temperaturen sjunker extra när högtrycket sätter in. Fostrat storspelare men förblir ett byalag.',
    playStyleTradition: 'akande',
  },
  'club_rogle': {
    clubId: 'club_rogle',
    arenaNote: 'Konstfrusen obligatorisk. Salt havsluft från Kattegatt.',
    patronType: 'Kustnäringens eldsjäl',
    klimateArchetype: 'scanian_coast',
    briefDescription: 'Sydligast i bandysverige. Kylanläggningen är en del av klubbens stolthet. Underdog i ett hockeylandskap.',
    playStyleTradition: 'spelande',
  },
  'club_slottsbron': {
    clubId: 'club_slottsbron',
    arenaNote: 'Konstfrusen bana vid Vänerns strand. Dimma och storm.',
    patronType: 'Sulfitbrukets veteranarbetare',
    klimateArchetype: 'vanern_effect',
    briefDescription: 'Bruksort vid Vänern. Sjön ger dimma, vind och stora skiftningar i stämning när vädret vänder.',
    playStyleTradition: 'akande',
  },
  'club_skutskar': {
    clubId: 'club_skutskar',
    arenaNote: 'Konstfrusen sedan 1961 — byggd utan kommunal insats.',
    patronType: 'Pappersbrukets skiftarbetare',
    klimateArchetype: 'gulf_coast',
    briefDescription: 'Vid Dalälvens mynning i Bottenhavet. Stolt brukshistoria och en bandybana klubben byggt med egna händer.',
    playStyleTradition: 'spelande',
  },
  'club_heros': {
    clubId: 'club_heros',
    arenaNote: 'Konstfrusen vid Norra Barkens strand.',
    patronType: 'Stålindustrins hantverkare',
    klimateArchetype: 'bruk_lakeside',
    briefDescription: 'Smedjebacken i södra Dalarna. Sjön ger dimma och fuktig luft — men banan håller och Norra Barken är alltid ett blickfång.',
    playStyleTradition: 'akande',
  },
}
