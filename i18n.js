/* Ododino – traductions de l'interface et choix de la langue.
   Pour ajouter une langue : copier un bloc, traduire, et l'ajouter à LANGS. */
window.I18N = {
  LANGS: [
    ['it', 'IT', 'Italiano', 'it-IT'],
    ['sl', 'SL', 'Slovenščina', 'sl-SI'],
    ['en', 'EN', 'English', 'en-GB'],
    ['de', 'DE', 'Deutsch', 'de-DE'],
    ['fr', 'FR', 'Français', 'fr-FR'],
  ],
  CONTACT: 'contact@ododino.it',
  TIMETABLE_URL: 'https://www.tplfvg.it/',

  // Langue : ?lang= > choix mémorisé > langue du navigateur > italien
  detect() {
    const codes = this.LANGS.map((l) => l[0]);
    const q = new URLSearchParams(location.search).get('lang');
    if (codes.includes(q)) return q;
    try { const s = localStorage.getItem('ododino.lang'); if (codes.includes(s)) return s; } catch { /* stockage indisponible */ }
    for (const l of navigator.languages || [navigator.language]) {
      const c = String(l).slice(0, 2).toLowerCase();
      if (codes.includes(c)) return c;
    }
    return 'it';
  },
  remember(l) { try { localStorage.setItem('ododino.lang', l); } catch { /* stockage indisponible */ } },
  locale(l) { return this.LANGS.find((x) => x[0] === l)[3]; },

  it: {
    subtitle: 'Valli del Natisone · Benecia',
    metaDesc: 'Punti di interesse e sentieri escursionistici delle Valli del Natisone, dai dati OpenStreetMap.',
    map: 'Mappa', togglePanel: 'Mostra / nascondi il pannello', language: 'Lingua',
    tabPois: 'Punti di interesse', tabTrails: 'Sentieri',
    searchPoi: 'Cerca un luogo, una cima, una chiesa…',
    searchTrail: 'Cerca un sentiero (n° CAI, nome)…',
    showPaths: 'Mostra tutti i sentieri e le piste (zoom ≥ 14)',
    dataBy: 'Dati ©', contributors: 'contributori OpenStreetMap', updated: 'aggiornato il', about: 'Informazioni e privacy',
    safety: 'Tracciati indicativi, tratti da OpenStreetMap: verificate le condizioni sul posto. Escursioni a vostro rischio.',
    emergency: 'Emergenza', ok: 'Ho capito',
    cats: {
      peak: ['Cime', 'Cima'], viewpoint: ['Punti panoramici', 'Punto panoramico'],
      church: ['Chiese', 'Chiesa'], shrine: ['Ancone e croci', 'Ancona'],
      history: ['Patrimonio storico', 'Luogo storico'], culture: ['Musei e curiosità', 'Attrazione'],
      cave: ['Grotte', 'Grotta'], water: ['Sorgenti e cascate', "Punto d'acqua"],
      hut: ['Rifugi e ricoveri', 'Ricovero'], outdoor: ['Picnic e campeggi', 'Area picnic'],
      food: ['Ristoranti e bar', 'Ristorante'], sleep: ['Alloggi', 'Alloggio'],
      info: ['Informazioni', 'Punto informazioni'], saddle: ['Passi e selle', 'Passo'],
      parking: ['Parcheggi', 'Parcheggio'], bus: ['Fermate bus', 'Fermata bus'], drinking: ['Acqua potabile', 'Fontanella'], train: ['Stazioni', 'Stazione'],
    },
    nets: { iwn: 'Internazionale', nwn: 'Nazionale (Sentiero Italia…)', rwn: 'Regionale', lwn: 'Locale / CAI' },
    cai: { T: 'T – turistico', E: 'E – escursionistico', EE: 'EE – per escursionisti esperti', EEA: 'EEA – attrezzato (ferrata)' },
    length: 'Lunghezza ≈', difficulty: 'Difficoltà', duration: 'Durata', ascent: 'Dislivello +',
    from: 'Da', to: 'A', network: 'Rete', profile: 'Profilo e GPX', viewOsm: 'Vedi su OSM',
    website: 'Sito web', close: 'Chiudi', altitude: 'Altitudine', type: 'Tipo', hours: 'Orari',
    cuisine: 'Cucina', phone: 'Tel.', drinking: 'Acqua potabile', yes: 'sì', no: 'no', inscription: 'Iscrizione',
    trails: 'Sentieri', directions: 'Come arrivare', noTrail: 'Nessun sentiero corrisponde.',
    noResult: 'Nessun risultato.', path: 'Sentiero', track: 'Pista', sac: 'difficoltà',
    fee: 'A pagamento', capacity: 'Posti', lines: 'Linee', timetable: 'Orari bus (TPL FVG)',
    drinkingYes: 'segnalata (OSM, non verificata)', drinkingNo: 'non potabile', checked: 'Verificato il',
    waterNote: 'Controllate i cartelli sul posto; non bevete l’acqua delle sorgenti senza trattarla.',
    report: 'Segnala un errore',
    layerTrails: 'Sentieri segnalati', layerPois: 'Punti di interesse', layerWmt: 'Segnaletica Waymarked Trails',
    baseTopo: 'Topografica (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satellite (Esri)',
    caiTrail: 'Sentiero CAI {ref}', unnamed: 'Sentiero senza nome',
    back: '← Torna alla mappa',
    aboutHtml: `
      <h2>Che cos'è Ododino?</h2>
      <p>Ododino è una mappa indipendente e senza scopo di lucro delle Valli del Natisone (Benecia), pensata per chi vuole camminare: sentieri segnalati, cime, chiese, sorgenti, grotte, rifugi, ma anche parcheggi e fermate dell'autobus.</p>
      <h2>Da dove vengono i dati?</h2>
      <p>Tutti i luoghi e i sentieri provengono da <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© contributori OpenStreetMap, licenza ODbL) e sono aggiornati ogni settimana. Sfondi: OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri.</p>
      <p>Trovate un errore? Il link «Segnala un errore» in ogni scheda apre una nota su OpenStreetMap: la correzione servirà a tutti.</p>
      <h2>Sicurezza</h2>
      <p>I tracciati sono indicativi e possono essere incompleti o non aggiornati. Controllate il meteo e le condizioni del sentiero prima di partire; l'escursione è sotto la vostra responsabilità. In caso di emergenza, in Italia come in Slovenia: <strong>112</strong>.</p>
      <p><strong>Acqua:</strong> le fontanelle indicate come potabili sono segnalate dai contributori di OpenStreetMap, non da analisi ufficiali, e possono essere asciutte d’estate. Controllate sempre i cartelli sul posto, portate con voi una scorta d’acqua e non bevete l’acqua delle sorgenti senza trattarla.</p>
      <h2>Privacy</h2>
      <ul>
        <li>Nessun cookie. Statistiche di visita anonime e aggregate con <a href="https://www.goatcounter.com/">GoatCounter</a>, senza dati personali.</li>
        <li>La lingua scelta è memorizzata solo nel vostro browser.</li>
        <li>Le tessere della mappa vengono caricate dai server di OpenTopoMap, OpenStreetMap o Esri, che vedono il vostro indirizzo IP come per qualsiasi sito.</li>
        <li>Font e librerie sono ospitati sul sito stesso.</li>
      </ul>
      <h2>Contatto</h2>
      <p>{contact}</p>`,
  },

  sl: {
    subtitle: 'Nediške doline · Benečija',
    metaDesc: 'Zanimivosti in pohodniške poti Nediških dolin, po podatkih OpenStreetMap.',
    map: 'Zemljevid', togglePanel: 'Prikaži / skrij ploščo', language: 'Jezik',
    tabPois: 'Zanimivosti', tabTrails: 'Poti',
    searchPoi: 'Iščite kraj, vrh, cerkev …',
    searchTrail: 'Iščite pot (št. CAI, ime) …',
    showPaths: 'Prikaži vse steze in kolovoze (povečava ≥ 14)',
    dataBy: 'Podatki ©', contributors: 'sodelavci OpenStreetMap', updated: 'posodobljeno', about: 'O strani in zasebnost',
    safety: 'Poti so okvirne, povzete po OpenStreetMap: razmere preverite na kraju samem. Hodite na lastno odgovornost.',
    emergency: 'Klic v sili', ok: 'Razumem',
    cats: {
      peak: ['Vrhovi', 'Vrh'], viewpoint: ['Razgledišča', 'Razgledišče'],
      church: ['Cerkve', 'Cerkev'], shrine: ['Kapelice in križi', 'Kapelica'],
      history: ['Kulturna dediščina', 'Zgodovinski kraj'], culture: ['Muzeji in znamenitosti', 'Znamenitost'],
      cave: ['Jame', 'Jama'], water: ['Izviri in slapovi', 'Vodni vir'],
      hut: ['Koče in zavetišča', 'Zavetišče'], outdoor: ['Piknik in kampi', 'Prostor za piknik'],
      food: ['Restavracije in bari', 'Restavracija'], sleep: ['Prenočišča', 'Prenočišče'],
      info: ['Informacije', 'Informacijska točka'], saddle: ['Prelazi in sedla', 'Sedlo'],
      parking: ['Parkirišča', 'Parkirišče'], bus: ['Avtobusna postajališča', 'Avtobusno postajališče'], drinking: ['Pitna voda', 'Pitnik'], train: ['Železniške postaje', 'Železniška postaja'],
    },
    nets: { iwn: 'Mednarodne', nwn: 'Nacionalne (Sentiero Italia …)', rwn: 'Regionalne', lwn: 'Lokalne / CAI' },
    cai: { T: 'T – turistična', E: 'E – planinska', EE: 'EE – za izkušene planince', EEA: 'EEA – zavarovana (ferata)' },
    length: 'Dolžina ≈', difficulty: 'Zahtevnost', duration: 'Čas hoje', ascent: 'Vzpon',
    from: 'Od', to: 'Do', network: 'Omrežje', profile: 'Profil in GPX', viewOsm: 'Ogled na OSM',
    website: 'Spletna stran', close: 'Zapri', altitude: 'Nadmorska višina', type: 'Vrsta', hours: 'Odpiralni čas',
    cuisine: 'Kuhinja', phone: 'Tel.', drinking: 'Pitna voda', yes: 'da', no: 'ne', inscription: 'Napis',
    trails: 'Poti', directions: 'Kako do sem', noTrail: 'Nobena pot ne ustreza.',
    noResult: 'Ni zadetkov.', path: 'Steza', track: 'Kolovoz', sac: 'zahtevnost',
    fee: 'Plačljivo', capacity: 'Mest', lines: 'Linije', timetable: 'Vozni red avtobusov (TPL FVG)',
    drinkingYes: 'označena (OSM, ni preverjeno)', drinkingNo: 'ni pitna', checked: 'Preverjeno',
    waterNote: 'Preverite oznake na kraju samem; vode iz izvirov ne pijte neprečiščene.',
    report: 'Sporoči napako',
    layerTrails: 'Označene poti', layerPois: 'Zanimivosti', layerWmt: 'Markacije Waymarked Trails',
    baseTopo: 'Topografska (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satelitska (Esri)',
    caiTrail: 'Pot CAI {ref}', unnamed: 'Pot brez imena',
    back: '← Nazaj na zemljevid',
    aboutHtml: `
      <h2>Kaj je Ododino?</h2>
      <p>Ododino je neodvisen in nepridobiten zemljevid Nediških dolin (Benečije), namenjen pohodnikom: označene poti, vrhovi, cerkve, izviri, jame, zavetišča, pa tudi parkirišča in avtobusna postajališča.</p>
      <h2>Od kod so podatki?</h2>
      <p>Vsi kraji in poti so iz <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© sodelavci OpenStreetMap, licenca ODbL) in se posodabljajo vsak teden. Podlage: OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri.</p>
      <p>Ste našli napako? Povezava »Sporoči napako« na vsaki kartici odpre opombo na OpenStreetMap: popravek bo koristil vsem.</p>
      <h2>Varnost</h2>
      <p>Poti so okvirne in so lahko nepopolne ali zastarele. Pred odhodom preverite vreme in stanje poti; na pot se odpravite na lastno odgovornost. V sili, v Italiji in v Sloveniji: <strong>112</strong>.</p>
      <p><strong>Voda:</strong> pitnike, označene kot pitne, so vnesli sodelavci OpenStreetMap, ne uradne analize, poleti pa so lahko suhi. Vedno preverite oznake na kraju samem, vzemite s seboj zalogo vode in vode iz izvirov ne pijte neprečiščene.</p>
      <h2>Zasebnost</h2>
      <ul>
        <li>Brez piškotkov. Anonimna, združena statistika obiska z orodjem <a href="https://www.goatcounter.com/">GoatCounter</a>, brez osebnih podatkov.</li>
        <li>Izbrani jezik se shrani samo v vašem brskalniku.</li>
        <li>Ploščice zemljevida se nalagajo s strežnikov OpenTopoMap, OpenStreetMap ali Esri, ki vidijo vaš naslov IP kot pri vsaki spletni strani.</li>
        <li>Pisave in knjižnice gostujejo na sami strani.</li>
      </ul>
      <h2>Stik</h2>
      <p>{contact}</p>`,
  },

  en: {
    subtitle: 'Natisone Valleys · Benečija',
    metaDesc: 'Points of interest and hiking trails of the Natisone Valleys, from OpenStreetMap data.',
    map: 'Map', togglePanel: 'Show / hide panel', language: 'Language',
    tabPois: 'Points of interest', tabTrails: 'Trails',
    searchPoi: 'Search a place, a peak, a church…',
    searchTrail: 'Search a trail (CAI no., name)…',
    showPaths: 'Show all paths and tracks (zoom ≥ 14)',
    dataBy: 'Data ©', contributors: 'OpenStreetMap contributors', updated: 'updated', about: 'About & privacy',
    safety: 'Routes are indicative, taken from OpenStreetMap: check conditions on site. Hike at your own risk.',
    emergency: 'Emergency', ok: 'Got it',
    cats: {
      peak: ['Peaks', 'Peak'], viewpoint: ['Viewpoints', 'Viewpoint'],
      church: ['Churches', 'Church'], shrine: ['Shrines & crosses', 'Shrine'],
      history: ['Heritage', 'Historic site'], culture: ['Museums & sights', 'Sight'],
      cave: ['Caves', 'Cave'], water: ['Springs & waterfalls', 'Water point'],
      hut: ['Huts & shelters', 'Shelter'], outdoor: ['Picnic & camping', 'Picnic site'],
      food: ['Restaurants & bars', 'Restaurant'], sleep: ['Accommodation', 'Accommodation'],
      info: ['Information', 'Information point'], saddle: ['Passes & saddles', 'Pass'],
      parking: ['Car parks', 'Car park'], bus: ['Bus stops', 'Bus stop'], drinking: ['Drinking water', 'Drinking water point'], train: ['Train stations', 'Train station'],
    },
    nets: { iwn: 'International', nwn: 'National (Sentiero Italia…)', rwn: 'Regional', lwn: 'Local / CAI' },
    cai: { T: 'T – easy walk', E: 'E – hiking', EE: 'EE – experienced hikers', EEA: 'EEA – equipped (via ferrata)' },
    length: 'Length ≈', difficulty: 'Difficulty', duration: 'Duration', ascent: 'Ascent',
    from: 'From', to: 'To', network: 'Network', profile: 'Profile & GPX', viewOsm: 'View on OSM',
    website: 'Website', close: 'Close', altitude: 'Elevation', type: 'Type', hours: 'Opening hours',
    cuisine: 'Cuisine', phone: 'Phone', drinking: 'Drinking water', yes: 'yes', no: 'no', inscription: 'Inscription',
    trails: 'Trails', directions: 'Directions', noTrail: 'No matching trail.',
    noResult: 'No results.', path: 'Path', track: 'Track', sac: 'difficulty',
    fee: 'Paid', capacity: 'Spaces', lines: 'Lines', timetable: 'Bus timetables (TPL FVG)',
    drinkingYes: 'reported (OSM, unverified)', drinkingNo: 'not drinkable', checked: 'Last checked',
    waterNote: 'Check the signs on site; do not drink spring water without treating it.',
    report: 'Report an error',
    layerTrails: 'Waymarked trails', layerPois: 'Points of interest', layerWmt: 'Waymarked Trails overlay',
    baseTopo: 'Topographic (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satellite (Esri)',
    caiTrail: 'CAI trail {ref}', unnamed: 'Unnamed trail',
    back: '← Back to the map',
    aboutHtml: `
      <h2>What is Ododino?</h2>
      <p>Ododino is an independent, non-commercial map of the Natisone Valleys (Benečija) for walkers: waymarked trails, peaks, churches, springs, caves, shelters, as well as car parks and bus stops.</p>
      <h2>Where does the data come from?</h2>
      <p>All places and trails come from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© OpenStreetMap contributors, ODbL licence) and are updated every week. Base maps: OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri.</p>
      <p>Found a mistake? The “Report an error” link on every card opens a note on OpenStreetMap, so the fix benefits everyone.</p>
      <h2>Safety</h2>
      <p>Routes are indicative and may be incomplete or out of date. Check the weather and trail conditions before setting off; you hike at your own risk. In an emergency, in Italy and in Slovenia: <strong>112</strong>.</p>
      <p><strong>Water:</strong> taps and fountains shown as drinkable are reported by OpenStreetMap contributors, not by official testing, and may run dry in summer. Always check the signs on site, carry enough water and do not drink spring water without treating it.</p>
      <h2>Privacy</h2>
      <ul>
        <li>No cookies. Anonymous, aggregated visit statistics with <a href="https://www.goatcounter.com/">GoatCounter</a>, with no personal data.</li>
        <li>Your chosen language is stored only in your browser.</li>
        <li>Map tiles are loaded from OpenTopoMap, OpenStreetMap or Esri servers, which see your IP address as with any website.</li>
        <li>Fonts and libraries are hosted on this site.</li>
      </ul>
      <h2>Contact</h2>
      <p>{contact}</p>`,
  },

  de: {
    subtitle: 'Natisonetäler · Benečija',
    metaDesc: 'Sehenswertes und Wanderwege der Natisonetäler, nach Daten von OpenStreetMap.',
    map: 'Karte', togglePanel: 'Seitenleiste ein- / ausblenden', language: 'Sprache',
    tabPois: 'Sehenswertes', tabTrails: 'Wanderwege',
    searchPoi: 'Ort, Gipfel, Kirche suchen …',
    searchTrail: 'Wanderweg suchen (CAI-Nr., Name) …',
    showPaths: 'Alle Pfade und Fahrwege anzeigen (Zoom ≥ 14)',
    dataBy: 'Daten ©', contributors: 'OpenStreetMap-Mitwirkende', updated: 'aktualisiert am', about: 'Über & Datenschutz',
    safety: 'Wegverläufe sind Richtwerte aus OpenStreetMap: Bedingungen vor Ort prüfen. Wandern auf eigene Gefahr.',
    emergency: 'Notruf', ok: 'Verstanden',
    cats: {
      peak: ['Gipfel', 'Gipfel'], viewpoint: ['Aussichtspunkte', 'Aussichtspunkt'],
      church: ['Kirchen', 'Kirche'], shrine: ['Bildstöcke & Kreuze', 'Bildstock'],
      history: ['Kulturerbe', 'Historische Stätte'], culture: ['Museen & Sehenswürdigkeiten', 'Sehenswürdigkeit'],
      cave: ['Höhlen', 'Höhle'], water: ['Quellen & Wasserfälle', 'Wasserstelle'],
      hut: ['Hütten & Unterstände', 'Unterstand'], outdoor: ['Picknick & Camping', 'Picknickplatz'],
      food: ['Restaurants & Bars', 'Restaurant'], sleep: ['Unterkünfte', 'Unterkunft'],
      info: ['Information', 'Infopunkt'], saddle: ['Pässe & Sättel', 'Sattel'],
      parking: ['Parkplätze', 'Parkplatz'], bus: ['Bushaltestellen', 'Bushaltestelle'], drinking: ['Trinkwasser', 'Trinkwasserstelle'], train: ['Bahnhöfe', 'Bahnhof'],
    },
    nets: { iwn: 'International', nwn: 'National (Sentiero Italia …)', rwn: 'Regional', lwn: 'Lokal / CAI' },
    cai: { T: 'T – touristisch', E: 'E – Wanderweg', EE: 'EE – für geübte Wanderer', EEA: 'EEA – gesichert (Klettersteig)' },
    length: 'Länge ≈', difficulty: 'Schwierigkeit', duration: 'Gehzeit', ascent: 'Aufstieg',
    from: 'Von', to: 'Nach', network: 'Netz', profile: 'Profil & GPX', viewOsm: 'Auf OSM ansehen',
    website: 'Website', close: 'Schließen', altitude: 'Höhe', type: 'Typ', hours: 'Öffnungszeiten',
    cuisine: 'Küche', phone: 'Tel.', drinking: 'Trinkwasser', yes: 'ja', no: 'nein', inscription: 'Inschrift',
    trails: 'Wanderwege', directions: 'Route', noTrail: 'Kein passender Wanderweg.',
    noResult: 'Keine Ergebnisse.', path: 'Pfad', track: 'Fahrweg', sac: 'Schwierigkeit',
    fee: 'Gebührenpflichtig', capacity: 'Stellplätze', lines: 'Linien', timetable: 'Busfahrpläne (TPL FVG)',
    drinkingYes: 'gemeldet (OSM, ungeprüft)', drinkingNo: 'kein Trinkwasser', checked: 'Zuletzt geprüft',
    waterNote: 'Beschilderung vor Ort beachten; Quellwasser nicht unbehandelt trinken.',
    report: 'Fehler melden',
    layerTrails: 'Markierte Wanderwege', layerPois: 'Sehenswertes', layerWmt: 'Waymarked-Trails-Markierungen',
    baseTopo: 'Topografisch (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satellit (Esri)',
    caiTrail: 'CAI-Weg {ref}', unnamed: 'Unbenannter Weg',
    back: '← Zurück zur Karte',
    aboutHtml: `
      <h2>Was ist Ododino?</h2>
      <p>Ododino ist eine unabhängige, nichtkommerzielle Karte der Natisonetäler (Benečija) für Wanderer: markierte Wege, Gipfel, Kirchen, Quellen, Höhlen, Unterstände sowie Parkplätze und Bushaltestellen.</p>
      <h2>Woher stammen die Daten?</h2>
      <p>Alle Orte und Wege stammen aus <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© OpenStreetMap-Mitwirkende, Lizenz ODbL) und werden wöchentlich aktualisiert. Hintergrundkarten: OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri.</p>
      <p>Einen Fehler gefunden? Der Link „Fehler melden“ in jeder Karte öffnet einen Hinweis auf OpenStreetMap – so profitieren alle von der Korrektur.</p>
      <h2>Sicherheit</h2>
      <p>Die Wegverläufe sind Richtwerte und können unvollständig oder veraltet sein. Prüfen Sie vor dem Aufbruch Wetter und Wegzustand; Sie wandern auf eigene Gefahr. Im Notfall, in Italien wie in Slowenien: <strong>112</strong>.</p>
      <p><strong>Wasser:</strong> Als trinkbar markierte Brunnen beruhen auf Angaben von OpenStreetMap-Mitwirkenden, nicht auf amtlichen Prüfungen, und können im Sommer versiegen. Beachten Sie immer die Beschilderung vor Ort, nehmen Sie genug Wasser mit und trinken Sie Quellwasser nicht unbehandelt.</p>
      <h2>Datenschutz</h2>
      <ul>
        <li>Keine Cookies. Anonyme, zusammengefasste Besuchsstatistik mit <a href="https://www.goatcounter.com/">GoatCounter</a>, ohne personenbezogene Daten.</li>
        <li>Die gewählte Sprache wird nur in Ihrem Browser gespeichert.</li>
        <li>Kartenkacheln werden von den Servern von OpenTopoMap, OpenStreetMap oder Esri geladen, die – wie bei jeder Website – Ihre IP-Adresse sehen.</li>
        <li>Schriften und Bibliotheken werden auf dieser Website selbst gehostet.</li>
      </ul>
      <h2>Kontakt</h2>
      <p>{contact}</p>`,
  },

  fr: {
    subtitle: 'Vallées du Natisone · Benečija',
    metaDesc: "Points d'intérêt et sentiers de randonnée des vallées du Natisone, d'après OpenStreetMap.",
    map: 'Carte', togglePanel: 'Afficher / masquer le panneau', language: 'Langue',
    tabPois: "Points d'intérêt", tabTrails: 'Sentiers',
    searchPoi: 'Rechercher un lieu, un sommet, une église…',
    searchTrail: 'Rechercher un sentier (n° CAI, nom)…',
    showPaths: 'Afficher tous les chemins et pistes (zoom ≥ 14)',
    dataBy: 'Données ©', contributors: 'contributeurs OpenStreetMap', updated: 'mise à jour', about: 'À propos et confidentialité',
    safety: "Tracés indicatifs issus d'OpenStreetMap : vérifiez les conditions sur place. Randonnée à vos risques.",
    emergency: 'Urgences', ok: "J'ai compris",
    cats: {
      peak: ['Sommets', 'Sommet'], viewpoint: ['Panoramas', 'Panorama'],
      church: ['Églises', 'Église'], shrine: ['Ancônes, croix', 'Ancône'],
      history: ['Patrimoine', 'Site historique'], culture: ['Musées, curiosités', 'Curiosité'],
      cave: ['Grottes', 'Grotte'], water: ['Sources, cascades', "Point d'eau"],
      hut: ['Refuges, abris', 'Abri'], outdoor: ['Pique-nique, camping', 'Aire de pique-nique'],
      food: ['Restaurants, bars', 'Restaurant'], sleep: ['Hébergement', 'Hébergement'],
      info: ['Information', "Point d'information"], saddle: ['Cols', 'Col'],
      parking: ['Parkings', 'Parking'], bus: ['Arrêts de bus', 'Arrêt de bus'], drinking: ['Eau potable', "Point d'eau potable"], train: ['Gares', 'Gare'],
    },
    nets: { iwn: 'International', nwn: 'National (Sentiero Italia…)', rwn: 'Régional', lwn: 'Local / CAI' },
    cai: { T: 'T – touristique', E: 'E – randonnée', EE: 'EE – randonneurs expérimentés', EEA: 'EEA – équipé (via ferrata)' },
    length: 'Longueur ≈', difficulty: 'Difficulté', duration: 'Durée', ascent: 'Dénivelé +',
    from: 'De', to: 'À', network: 'Réseau', profile: 'Profil & GPX', viewOsm: 'Voir sur OSM',
    website: 'Site web', close: 'Fermer', altitude: 'Altitude', type: 'Type', hours: 'Horaires',
    cuisine: 'Cuisine', phone: 'Tél.', drinking: 'Eau potable', yes: 'oui', no: 'non', inscription: 'Inscription',
    trails: 'Sentiers', directions: 'Itinéraire', noTrail: 'Aucun sentier ne correspond.',
    noResult: 'Aucun résultat.', path: 'Sentier', track: 'Piste', sac: 'difficulté',
    fee: 'Payant', capacity: 'Places', lines: 'Lignes', timetable: 'Horaires des bus (TPL FVG)',
    drinkingYes: 'signalée (OSM, non vérifiée)', drinkingNo: 'non potable', checked: 'Vérifié le',
    waterNote: "Vérifiez la signalisation sur place ; ne buvez pas l'eau des sources sans la traiter.",
    report: 'Signaler une erreur',
    layerTrails: 'Sentiers balisés', layerPois: "Points d'intérêt", layerWmt: 'Balisage Waymarked Trails',
    baseTopo: 'Topographique (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satellite (Esri)',
    caiTrail: 'Sentier CAI {ref}', unnamed: 'Sentier sans nom',
    back: '← Retour à la carte',
    aboutHtml: `
      <h2>Qu'est-ce qu'Ododino ?</h2>
      <p>Ododino est une carte indépendante et non commerciale des vallées du Natisone (Benečija), pensée pour les marcheurs : sentiers balisés, sommets, églises, sources, grottes, abris, mais aussi parkings et arrêts de bus.</p>
      <h2>D'où viennent les données ?</h2>
      <p>Tous les lieux et sentiers proviennent d'<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© contributeurs OpenStreetMap, licence ODbL) et sont mis à jour chaque semaine. Fonds de carte : OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri.</p>
      <p>Vous avez repéré une erreur ? Le lien « Signaler une erreur » de chaque fiche ouvre une note sur OpenStreetMap : la correction profitera à tous.</p>
      <h2>Sécurité</h2>
      <p>Les tracés sont indicatifs et peuvent être incomplets ou obsolètes. Vérifiez la météo et l'état des sentiers avant de partir ; la randonnée se fait sous votre responsabilité. En cas d'urgence, en Italie comme en Slovénie : <strong>112</strong>.</p>
      <p><strong>Eau :</strong> les fontaines indiquées comme potables sont signalées par les contributeurs d'OpenStreetMap, pas par des analyses officielles, et peuvent être à sec en été. Vérifiez toujours la signalisation sur place, emportez une réserve d'eau et ne buvez pas l'eau des sources sans la traiter.</p>
      <h2>Confidentialité</h2>
      <ul>
        <li>Aucun cookie. Statistiques de visite anonymes et agrégées avec <a href="https://www.goatcounter.com/">GoatCounter</a>, sans données personnelles.</li>
        <li>La langue choisie est enregistrée uniquement dans votre navigateur.</li>
        <li>Les tuiles de la carte sont chargées depuis les serveurs d'OpenTopoMap, d'OpenStreetMap ou d'Esri, qui voient votre adresse IP comme pour n'importe quel site.</li>
        <li>Les polices et bibliothèques sont hébergées sur le site lui-même.</li>
      </ul>
      <h2>Contact</h2>
      <p>{contact}</p>`,
  },
};
