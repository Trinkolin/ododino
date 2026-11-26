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
  // Responsable du traitement (RGPD, art. 13) : prénom + initiale du nom
  CONTROLLER: 'Jess C.',
  PRIVACY_UPDATED: '2026-11-26',
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
    sacEst: "stimata dai tratti (SAC {x})", notRated: "non indicata", durationCai: "Durata CAI", timeEst: "Tempo indicativo", descent: "Dislivello −", altRange: "Quota", profileNA: "Profilo non disponibile: sentiero in più tratti separati.", profileLabel: "Profilo altimetrico", gpx: "GPX", layerRelief: "Rilievo ombreggiato",
    report: 'Segnala un errore',
    layerTrails: 'Sentieri segnalati', layerPois: 'Punti di interesse', layerWmt: 'Segnaletica Waymarked Trails',
    baseTopo: 'Topografica (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satellite (Esri)',
    caiTrail: 'Sentiero CAI {ref}', unnamed: 'Sentiero senza nome',
    back: '← Torna alla mappa',
    aboutHtml: `
      <h2>Che cos'è Ododino?</h2>
      <p>Ododino è una mappa indipendente e senza scopo di lucro delle Valli del Natisone (Benecia), pensata per chi vuole camminare: sentieri segnalati, cime, chiese, sorgenti, grotte, rifugi, ma anche parcheggi e fermate dell'autobus.</p>
      <h2>Da dove vengono i dati?</h2>
      <p>Tutti i luoghi e i sentieri provengono da <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© contributori OpenStreetMap, licenza ODbL) e sono aggiornati ogni settimana. Sfondi: OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri. Altitudini e rilievo: Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 e © Airbus Defence and Space GmbH 2014-2018, fornito nell’ambito di COPERNICUS dall’Unione europea e dall’ESA); i dislivelli e i tempi sono stime.</p>
      <p>Trovate un errore? Il link «Segnala un errore» in ogni scheda apre una nota su OpenStreetMap: la correzione servirà a tutti.</p>
      <h2>Sicurezza</h2>
      <p>I tracciati sono indicativi e possono essere incompleti o non aggiornati. Controllate il meteo e le condizioni del sentiero prima di partire; l'escursione è sotto la vostra responsabilità. In caso di emergenza, in Italia come in Slovenia: <strong>112</strong>.</p>
      <p><strong>Acqua:</strong> le fontanelle indicate come potabili sono segnalate dai contributori di OpenStreetMap, non da analisi ufficiali, e possono essere asciutte d’estate. Controllate sempre i cartelli sul posto, portate con voi una scorta d’acqua e non bevete l’acqua delle sorgenti senza trattarla.</p>
      <h2>Privacy (GDPR)</h2>
      <p><strong>Titolare del trattamento:</strong> {controller}, {contact}. Ododino è un sito personale, senza scopo di lucro: niente account, niente pubblicità, nessun cookie.</p>
      <ul>
        <li><strong>Hosting:</strong> il sito è ospitato da GitHub Pages (GitHub Inc., Stati Uniti), che registra l’indirizzo IP dei visitatori nei log del server per motivi di sicurezza. Il trasferimento verso gli Stati Uniti è coperto dal Data Privacy Framework UE–USA. Base giuridica: legittimo interesse a far funzionare un sito sicuro (art. 6.1.f GDPR).</li>
        <li><strong>Statistiche:</strong> GoatCounter conta le visite in forma anonima e aggregata, senza cookie e senza conservare dati personali (art. 6.1.f).</li>
        <li><strong>Mappe:</strong> le tessere vengono caricate direttamente dai server della mappa scelta, che vedono il vostro indirizzo IP e la zona visualizzata: OpenTopoMap (sfondo predefinito), OpenStreetMap Foundation (Regno Unito), Waymarked Trails (solo se attivate il livello) ed Esri (Stati Uniti, solo se scegliete il satellite).</li>
        <li><strong>Memoria del browser:</strong> la lingua scelta e la chiusura dell’avviso di sicurezza sono salvate solo nel vostro browser (localStorage) e non vengono mai inviate. Potete cancellarle dalle impostazioni del browser.</li>
        <li><strong>E-mail:</strong> se ci scrivete, il vostro indirizzo e il messaggio servono solo a rispondervi e vengono cancellati al più tardi 12 mesi dopo.</li>
        <li><strong>Link esterni</strong> (OpenStreetMap, Wikipedia, siti dei luoghi): si applica la loro informativa.</li>
      </ul>
      <p><strong>I vostri diritti:</strong> accesso, rettifica, cancellazione, limitazione e opposizione, scrivendo a {contact}. Potete anche presentare reclamo all’Autorità per la protezione dei dati belga (<a href="https://www.dataprotectionauthority.be">www.dataprotectionauthority.be</a>) o a quella del vostro paese.</p>
      <p class="muted">Ultimo aggiornamento: {updated}</p>`,
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
    sacEst: "ocena po odsekih (SAC {x})", notRated: "ni podatka", durationCai: "Čas po CAI", timeEst: "Okvirni čas", descent: "Spust", altRange: "Višina", profileNA: "Profil ni na voljo: pot je sestavljena iz ločenih odsekov.", profileLabel: "Višinski profil", gpx: "GPX", layerRelief: "Senčen relief",
    report: 'Sporoči napako',
    layerTrails: 'Označene poti', layerPois: 'Zanimivosti', layerWmt: 'Markacije Waymarked Trails',
    baseTopo: 'Topografska (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satelitska (Esri)',
    caiTrail: 'Pot CAI {ref}', unnamed: 'Pot brez imena',
    back: '← Nazaj na zemljevid',
    aboutHtml: `
      <h2>Kaj je Ododino?</h2>
      <p>Ododino je neodvisen in nepridobiten zemljevid Nediških dolin (Benečije), namenjen pohodnikom: označene poti, vrhovi, cerkve, izviri, jame, zavetišča, pa tudi parkirišča in avtobusna postajališča.</p>
      <h2>Od kod so podatki?</h2>
      <p>Vsi kraji in poti so iz <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© sodelavci OpenStreetMap, licenca ODbL) in se posodabljajo vsak teden. Podlage: OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri. Višine in relief: Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 in © Airbus Defence and Space GmbH 2014-2018, v okviru programa COPERNICUS zagotavljata Evropska unija in ESA); višinske razlike in časi so ocene.</p>
      <p>Ste našli napako? Povezava »Sporoči napako« na vsaki kartici odpre opombo na OpenStreetMap: popravek bo koristil vsem.</p>
      <h2>Varnost</h2>
      <p>Poti so okvirne in so lahko nepopolne ali zastarele. Pred odhodom preverite vreme in stanje poti; na pot se odpravite na lastno odgovornost. V sili, v Italiji in v Sloveniji: <strong>112</strong>.</p>
      <p><strong>Voda:</strong> pitnike, označene kot pitne, so vnesli sodelavci OpenStreetMap, ne uradne analize, poleti pa so lahko suhi. Vedno preverite oznake na kraju samem, vzemite s seboj zalogo vode in vode iz izvirov ne pijte neprečiščene.</p>
      <h2>Varstvo osebnih podatkov (GDPR)</h2>
      <p><strong>Upravljavec:</strong> {controller}, {contact}. Ododino je osebna, nepridobitna stran: brez računov, brez oglasov, brez piškotkov.</p>
      <ul>
        <li><strong>Gostovanje:</strong> stran gostuje na GitHub Pages (GitHub Inc., ZDA), ki zaradi varnosti v strežniške dnevnike beleži naslov IP obiskovalcev. Prenos v ZDA pokriva okvir EU–ZDA za zasebnost podatkov (Data Privacy Framework). Pravna podlaga: zakoniti interes za varno delovanje strani (člen 6(1)(f) GDPR).</li>
        <li><strong>Statistika:</strong> GoatCounter šteje obiske anonimno in združeno, brez piškotkov in brez shranjevanja osebnih podatkov (člen 6(1)(f)).</li>
        <li><strong>Zemljevidi:</strong> ploščice se nalagajo neposredno s strežnikov izbrane podlage, ki vidijo vaš naslov IP in prikazano območje: OpenTopoMap (privzeta podlaga), OpenStreetMap Foundation (Združeno kraljestvo), Waymarked Trails (le če vklopite sloj) in Esri (ZDA, le če izberete satelitsko podlago).</li>
        <li><strong>Shramba brskalnika:</strong> izbrani jezik in zaprto varnostno opozorilo se shranita le v vašem brskalniku (localStorage) in se nikoli ne pošljeta. Izbrišete ju lahko v nastavitvah brskalnika.</li>
        <li><strong>E-pošta:</strong> če nam pišete, se vaš naslov in sporočilo uporabita le za odgovor in se izbrišeta najpozneje po 12 mesecih.</li>
        <li><strong>Zunanje povezave</strong> (OpenStreetMap, Wikipedija, spletne strani krajev): velja njihova politika zasebnosti.</li>
      </ul>
      <p><strong>Vaše pravice:</strong> dostop, popravek, izbris, omejitev in ugovor – pišite na {contact}. Pritožbo lahko vložite tudi pri belgijskem organu za varstvo podatkov (<a href="https://www.dataprotectionauthority.be">www.dataprotectionauthority.be</a>) ali pri organu v vaši državi.</p>
      <p class="muted">Zadnja posodobitev: {updated}</p>`,
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
    sacEst: "estimated from sections (SAC {x})", notRated: "not given", durationCai: "CAI time", timeEst: "Indicative time", descent: "Descent", altRange: "Altitude", profileNA: "Profile not available: this trail is made of separate sections.", profileLabel: "Elevation profile", gpx: "GPX", layerRelief: "Hillshade",
    report: 'Report an error',
    layerTrails: 'Waymarked trails', layerPois: 'Points of interest', layerWmt: 'Waymarked Trails overlay',
    baseTopo: 'Topographic (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satellite (Esri)',
    caiTrail: 'CAI trail {ref}', unnamed: 'Unnamed trail',
    back: '← Back to the map',
    aboutHtml: `
      <h2>What is Ododino?</h2>
      <p>Ododino is an independent, non-commercial map of the Natisone Valleys (Benečija) for walkers: waymarked trails, peaks, churches, springs, caves, shelters, as well as car parks and bus stops.</p>
      <h2>Where does the data come from?</h2>
      <p>All places and trails come from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© OpenStreetMap contributors, ODbL licence) and are updated every week. Base maps: OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri. Elevation and hillshade: Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA); ascents and times are estimates.</p>
      <p>Found a mistake? The “Report an error” link on every card opens a note on OpenStreetMap, so the fix benefits everyone.</p>
      <h2>Safety</h2>
      <p>Routes are indicative and may be incomplete or out of date. Check the weather and trail conditions before setting off; you hike at your own risk. In an emergency, in Italy and in Slovenia: <strong>112</strong>.</p>
      <p><strong>Water:</strong> taps and fountains shown as drinkable are reported by OpenStreetMap contributors, not by official testing, and may run dry in summer. Always check the signs on site, carry enough water and do not drink spring water without treating it.</p>
      <h2>Privacy (GDPR)</h2>
      <p><strong>Data controller:</strong> {controller}, {contact}. Ododino is a personal, non-commercial website: no accounts, no advertising, no cookies.</p>
      <ul>
        <li><strong>Hosting:</strong> the site is hosted on GitHub Pages (GitHub Inc., United States), which records visitors’ IP addresses in its server logs for security purposes. The transfer to the United States is covered by the EU–US Data Privacy Framework. Legal basis: legitimate interest in running a secure website (Art. 6(1)(f) GDPR).</li>
        <li><strong>Statistics:</strong> GoatCounter counts visits anonymously and in aggregate, without cookies and without storing personal data (Art. 6(1)(f)).</li>
        <li><strong>Maps:</strong> tiles are loaded directly from the servers of the chosen map, which see your IP address and the area displayed: OpenTopoMap (default), the OpenStreetMap Foundation (United Kingdom), Waymarked Trails (only if you enable that layer) and Esri (United States, only if you choose satellite).</li>
        <li><strong>Browser storage:</strong> your chosen language and the dismissed safety notice are stored only in your browser (localStorage) and are never sent anywhere. You can clear them in your browser settings.</li>
        <li><strong>E-mail:</strong> if you write to us, your address and message are used only to reply and are deleted within 12 months at the latest.</li>
        <li><strong>External links</strong> (OpenStreetMap, Wikipedia, places’ websites): their own privacy policies apply.</li>
      </ul>
      <p><strong>Your rights:</strong> access, rectification, erasure, restriction and objection, by writing to {contact}. You can also lodge a complaint with the Belgian Data Protection Authority (<a href="https://www.dataprotectionauthority.be">www.dataprotectionauthority.be</a>) or with the authority of your own country.</p>
      <p class="muted">Last updated: {updated}</p>`,
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
    sacEst: "geschätzt nach Abschnitten (SAC {x})", notRated: "keine Angabe", durationCai: "Gehzeit (CAI)", timeEst: "Gehzeit (Richtwert)", descent: "Abstieg", altRange: "Höhe", profileNA: "Kein Höhenprofil: Der Weg besteht aus getrennten Abschnitten.", profileLabel: "Höhenprofil", gpx: "GPX", layerRelief: "Schummerung",
    report: 'Fehler melden',
    layerTrails: 'Markierte Wanderwege', layerPois: 'Sehenswertes', layerWmt: 'Waymarked-Trails-Markierungen',
    baseTopo: 'Topografisch (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satellit (Esri)',
    caiTrail: 'CAI-Weg {ref}', unnamed: 'Unbenannter Weg',
    back: '← Zurück zur Karte',
    aboutHtml: `
      <h2>Was ist Ododino?</h2>
      <p>Ododino ist eine unabhängige, nichtkommerzielle Karte der Natisonetäler (Benečija) für Wanderer: markierte Wege, Gipfel, Kirchen, Quellen, Höhlen, Unterstände sowie Parkplätze und Bushaltestellen.</p>
      <h2>Woher stammen die Daten?</h2>
      <p>Alle Orte und Wege stammen aus <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© OpenStreetMap-Mitwirkende, Lizenz ODbL) und werden wöchentlich aktualisiert. Hintergrundkarten: OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri. Höhen und Schummerung: Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 und © Airbus Defence and Space GmbH 2014-2018, bereitgestellt im Rahmen von COPERNICUS durch die Europäische Union und die ESA); Höhenmeter und Gehzeiten sind Schätzungen.</p>
      <p>Einen Fehler gefunden? Der Link „Fehler melden“ in jeder Karte öffnet einen Hinweis auf OpenStreetMap – so profitieren alle von der Korrektur.</p>
      <h2>Sicherheit</h2>
      <p>Die Wegverläufe sind Richtwerte und können unvollständig oder veraltet sein. Prüfen Sie vor dem Aufbruch Wetter und Wegzustand; Sie wandern auf eigene Gefahr. Im Notfall, in Italien wie in Slowenien: <strong>112</strong>.</p>
      <p><strong>Wasser:</strong> Als trinkbar markierte Brunnen beruhen auf Angaben von OpenStreetMap-Mitwirkenden, nicht auf amtlichen Prüfungen, und können im Sommer versiegen. Beachten Sie immer die Beschilderung vor Ort, nehmen Sie genug Wasser mit und trinken Sie Quellwasser nicht unbehandelt.</p>
      <h2>Datenschutz (DSGVO)</h2>
      <p><strong>Verantwortlich:</strong> {controller}, {contact}. Ododino ist eine private, nichtkommerzielle Website: keine Konten, keine Werbung, keine Cookies.</p>
      <ul>
        <li><strong>Hosting:</strong> Die Website liegt bei GitHub Pages (GitHub Inc., USA), das die IP-Adressen der Besucher aus Sicherheitsgründen in Server-Logs speichert. Die Übermittlung in die USA ist durch das EU-US Data Privacy Framework abgedeckt. Rechtsgrundlage: berechtigtes Interesse am sicheren Betrieb der Website (Art. 6 Abs. 1 lit. f DSGVO).</li>
        <li><strong>Statistik:</strong> GoatCounter zählt Besuche anonym und zusammengefasst, ohne Cookies und ohne Speicherung personenbezogener Daten (Art. 6 Abs. 1 lit. f).</li>
        <li><strong>Karten:</strong> Kartenkacheln werden direkt von den Servern der gewählten Karte geladen, die Ihre IP-Adresse und den angezeigten Ausschnitt sehen: OpenTopoMap (Standard), OpenStreetMap Foundation (Vereinigtes Königreich), Waymarked Trails (nur wenn Sie die Ebene einschalten) und Esri (USA, nur wenn Sie Satellit wählen).</li>
        <li><strong>Browserspeicher:</strong> Die gewählte Sprache und der geschlossene Sicherheitshinweis werden nur in Ihrem Browser gespeichert (localStorage) und nie übertragen. Sie können sie in den Browsereinstellungen löschen.</li>
        <li><strong>E-Mail:</strong> Wenn Sie uns schreiben, werden Ihre Adresse und Nachricht nur zur Antwort verwendet und spätestens nach 12 Monaten gelöscht.</li>
        <li><strong>Externe Links</strong> (OpenStreetMap, Wikipedia, Websites der Orte): Es gelten deren Datenschutzerklärungen.</li>
      </ul>
      <p><strong>Ihre Rechte:</strong> Auskunft, Berichtigung, Löschung, Einschränkung und Widerspruch – schreiben Sie an {contact}. Sie können sich außerdem bei der belgischen Datenschutzbehörde (<a href="https://www.dataprotectionauthority.be">www.dataprotectionauthority.be</a>) oder bei der Behörde Ihres Landes beschweren.</p>
      <p class="muted">Zuletzt aktualisiert: {updated}</p>`,
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
    sacEst: "d'après les tronçons (SAC {x})", notRated: "non renseignée", durationCai: "Durée CAI", timeEst: "Temps indicatif", descent: "Dénivelé −", altRange: "Altitude", profileNA: "Profil indisponible : sentier en plusieurs tronçons séparés.", profileLabel: "Profil d'altitude", gpx: "GPX", layerRelief: "Relief ombré",
    report: 'Signaler une erreur',
    layerTrails: 'Sentiers balisés', layerPois: "Points d'intérêt", layerWmt: 'Balisage Waymarked Trails',
    baseTopo: 'Topographique (OpenTopoMap)', baseOsm: 'OpenStreetMap', baseSat: 'Satellite (Esri)',
    caiTrail: 'Sentier CAI {ref}', unnamed: 'Sentier sans nom',
    back: '← Retour à la carte',
    aboutHtml: `
      <h2>Qu'est-ce qu'Ododino ?</h2>
      <p>Ododino est une carte indépendante et non commerciale des vallées du Natisone (Benečija), pensée pour les marcheurs : sentiers balisés, sommets, églises, sources, grottes, abris, mais aussi parkings et arrêts de bus.</p>
      <h2>D'où viennent les données ?</h2>
      <p>Tous les lieux et sentiers proviennent d'<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (© contributeurs OpenStreetMap, licence ODbL) et sont mis à jour chaque semaine. Fonds de carte : OpenTopoMap (CC-BY-SA), OpenStreetMap, Esri. Altitudes et relief : Copernicus DEM GLO-30 (© DLR e.V. 2010-2014 et © Airbus Defence and Space GmbH 2014-2018, fourni dans le cadre de COPERNICUS par l'Union européenne et l'ESA) ; dénivelés et temps sont des estimations.</p>
      <p>Vous avez repéré une erreur ? Le lien « Signaler une erreur » de chaque fiche ouvre une note sur OpenStreetMap : la correction profitera à tous.</p>
      <h2>Sécurité</h2>
      <p>Les tracés sont indicatifs et peuvent être incomplets ou obsolètes. Vérifiez la météo et l'état des sentiers avant de partir ; la randonnée se fait sous votre responsabilité. En cas d'urgence, en Italie comme en Slovénie : <strong>112</strong>.</p>
      <p><strong>Eau :</strong> les fontaines indiquées comme potables sont signalées par les contributeurs d'OpenStreetMap, pas par des analyses officielles, et peuvent être à sec en été. Vérifiez toujours la signalisation sur place, emportez une réserve d'eau et ne buvez pas l'eau des sources sans la traiter.</p>
      <h2>Confidentialité (RGPD)</h2>
      <p><strong>Responsable du traitement :</strong> {controller}, {contact}. Ododino est un site personnel et non commercial : pas de compte, pas de publicité, aucun cookie.</p>
      <ul>
        <li><strong>Hébergement :</strong> le site est hébergé par GitHub Pages (GitHub Inc., États-Unis), qui enregistre l'adresse IP des visiteurs dans ses journaux de serveur pour des raisons de sécurité. Le transfert vers les États-Unis est couvert par le cadre de protection des données UE–États-Unis (Data Privacy Framework). Base légale : l'intérêt légitime à faire fonctionner un site sûr (art. 6.1.f du RGPD).</li>
        <li><strong>Statistiques :</strong> GoatCounter compte les visites de façon anonyme et agrégée, sans cookie et sans conserver de données personnelles (art. 6.1.f).</li>
        <li><strong>Cartes :</strong> les tuiles sont chargées directement depuis les serveurs du fond choisi, qui voient votre adresse IP et la zone affichée : OpenTopoMap (fond par défaut), OpenStreetMap Foundation (Royaume-Uni), Waymarked Trails (seulement si vous activez la couche) et Esri (États-Unis, seulement si vous choisissez le satellite).</li>
        <li><strong>Stockage du navigateur :</strong> la langue choisie et la fermeture de l'avertissement de sécurité sont enregistrées uniquement dans votre navigateur (localStorage) et ne sont jamais envoyées. Vous pouvez les effacer dans les réglages du navigateur.</li>
        <li><strong>E-mails :</strong> si vous nous écrivez, votre adresse et votre message servent uniquement à vous répondre et sont supprimés au plus tard 12 mois après.</li>
        <li><strong>Liens externes</strong> (OpenStreetMap, Wikipédia, sites des lieux) : leur propre politique de confidentialité s'applique.</li>
      </ul>
      <p><strong>Vos droits :</strong> accès, rectification, effacement, limitation et opposition, en écrivant à {contact}. Vous pouvez aussi introduire une réclamation auprès de l'Autorité de protection des données belge (<a href="https://www.autoriteprotectiondonnees.be">autoriteprotectiondonnees.be</a>) ou de celle de votre pays.</p>
      <p class="muted">Dernière mise à jour : {updated}</p>`,
  },
};
