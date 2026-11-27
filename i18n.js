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
  // Boutons IT · SL · EN · DE · FR, partagés par la carte et la page « À propos »
  switcherHtml(current) {
    return this.LANGS.map(([c, short, name]) =>
      `<button data-lang="${c}" class="${c === current ? 'on' : ''}" title="${name}" lang="${c}" aria-pressed="${c === current}">${short}</button>`).join('');
  },

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
    tabRoute: "Itinerario",
    routeHelp: "Toccate o cliccate la mappa per mettere la partenza, poi le tappe: il percorso segue i sentieri. Trascinate un punto per spostarlo.",
    routeLoadError: "Impossibile caricare i sentieri: riprovate più tardi.",
    routeLoading: "Caricamento dei sentieri…",
    routeMarkedOnly: "Solo sentieri segnalati",
    routeAllowAlpine: "Consenti i passaggi alpinistici (T4 e oltre)",
    routeUndo: "Annulla",
    routeClear: "Cancella",
    routeImport: "Importa GPX",
    routeExport: "Scarica GPX",
    routeImported: "Traccia importata",
    routeWarnT3: "Questo percorso passa da tratti difficili (SAC T3 o più), in rosso sulla mappa.",
    routeWarnT4: "Questo percorso passa da tratti alpinistici (SAC T4 o più), in rosso: solo per escursionisti esperti e attrezzati.",
    routeFail: "Nessun percorso trovato tra due tappe (linea tratteggiata): spostate un punto o cambiate le opzioni.",
    routeNoPath: "Nessun sentiero vicino a questo punto.",
    routeShare: "Il link della pagina contiene il vostro percorso: copiatelo per condividerlo. Nulla viene inviato a un server.",
    routeName: "Itinerario Ododino",
    routeRemove: "Togli questo punto",
    importNoEle: "Il file non contiene altitudini: solo la lunghezza.",
    importError: "File GPX illeggibile.",
    offline: "Offline",
    offlineDownload: "Rendi disponibile offline ({size})",
    offlineProgress: "Download in corso… {p} %",
    offlineDone: "Mappa disponibile offline.",
    offlineReady: "Disponibile offline (aggiornato il {date}).",
    offlineStale: "Sono disponibili dati più recenti.",
    offlineUpdate: "Aggiorna",
    offlineRefresh: "Scarica di nuovo",
    offlineRemove: "Elimina",
    offlineError: "Download non riuscito: riprovate con una connessione stabile.",
    offlineNote: "Scarica la mappa semplificata della zona, il rilievo, i profili, i GPX e il calcolo degli itinerari, per usarli senza rete in montagna. Le altre mappe restano solo online.",
    offlineUnavailable: "Pacchetto offline non disponibile su questa versione del sito.",
    offlineUnsupported: "Questo browser non permette l’uso offline.",
    offlineNow: "Siete offline: mappa semplificata della zona.",
    baseOffline: "Offline (vettoriale)",
    locate: "La mia posizione",
    locateDenied: "Posizione negata: autorizzatela nelle impostazioni del browser.",
    locateUnavailable: "Posizione non disponibile.",
    youAreHere: "Siete qui (± {m} m)",
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
        <li><strong>Itinerari e GPX:</strong> il calcolo del percorso e la lettura dei file GPX importati avvengono solo nel vostro browser; nulla viene inviato.</li>
        <li><strong>Posizione GPS:</strong> solo se toccate «La mia posizione», previo consenso del browser; viene usata solo sulla mappa nel vostro dispositivo e mai inviata. <strong>Uso offline:</strong> i file della mappa scaricati restano nel vostro browser e si possono eliminare.</li>
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
    tabRoute: "Načrt poti",
    routeHelp: "Tapnite ali kliknite zemljevid za izhodišče, nato za vmesne točke: pot sledi stezam. Točko premaknete tako, da jo povlečete.",
    routeLoadError: "Poti ni bilo mogoče naložiti: poskusite znova pozneje.",
    routeLoading: "Nalaganje poti …",
    routeMarkedOnly: "Samo označene poti",
    routeAllowAlpine: "Dovoli alpinistične odseke (T4 in več)",
    routeUndo: "Razveljavi",
    routeClear: "Počisti",
    routeImport: "Uvozi GPX",
    routeExport: "Prenesi GPX",
    routeImported: "Uvožena sled",
    routeWarnT3: "Ta pot vodi čez zahtevne odseke (SAC T3 ali več), na zemljevidu v rdeči barvi.",
    routeWarnT4: "Ta pot vodi čez alpinistične odseke (SAC T4 ali več), v rdeči barvi: samo za izkušene in opremljene pohodnike.",
    routeFail: "Med dvema točkama ni mogoče najti poti (črtkana črta): premaknite točko ali spremenite možnosti.",
    routeNoPath: "V bližini te točke ni nobene poti.",
    routeShare: "Povezava strani vsebuje vašo pot: kopirajte jo, da jo delite. Nič se ne pošlje na strežnik.",
    routeName: "Pot Ododino",
    routeRemove: "Odstrani to točko",
    importNoEle: "Datoteka ne vsebuje višin: samo dolžina.",
    importError: "Datoteke GPX ni mogoče prebrati.",
    offline: "Brez povezave",
    offlineDownload: "Omogoči uporabo brez povezave ({size})",
    offlineProgress: "Prenašanje … {p} %",
    offlineDone: "Zemljevid je na voljo brez povezave.",
    offlineReady: "Na voljo brez povezave (posodobljeno {date}).",
    offlineStale: "Na voljo so novejši podatki.",
    offlineUpdate: "Posodobi",
    offlineRefresh: "Prenesi znova",
    offlineRemove: "Izbriši",
    offlineError: "Prenos ni uspel: poskusite znova s stabilno povezavo.",
    offlineNote: "Prenese poenostavljen zemljevid območja, relief, profile, GPX in načrtovanje poti za uporabo brez signala v gorah. Druge podlage ostanejo samo na spletu.",
    offlineUnavailable: "Paket brez povezave v tej različici strani ni na voljo.",
    offlineUnsupported: "Ta brskalnik ne omogoča uporabe brez povezave.",
    offlineNow: "Ste brez povezave: poenostavljen zemljevid območja.",
    baseOffline: "Brez povezave (vektorska)",
    locate: "Moj položaj",
    locateDenied: "Dostop do položaja je zavrnjen: dovolite ga v nastavitvah brskalnika.",
    locateUnavailable: "Položaj ni na voljo.",
    youAreHere: "Tukaj ste (± {m} m)",
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
        <li><strong>Načrtovanje poti in GPX:</strong> izračun poti in branje uvoženih datotek GPX potekata samo v vašem brskalniku; nič se ne pošlje.</li>
        <li><strong>Položaj GPS:</strong> le če tapnete »Moj položaj« in to dovolite v brskalniku; uporablja se samo na zemljevidu v vaši napravi in se nikoli ne pošlje. <strong>Uporaba brez povezave:</strong> preneseni podatki ostanejo v vašem brskalniku in jih lahko izbrišete.</li>
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
    tabRoute: "Route",
    routeHelp: "Tap or click the map to set the start, then the stops: the route follows the paths. Drag a point to move it.",
    routeLoadError: "Could not load the paths: please try again later.",
    routeLoading: "Loading paths…",
    routeMarkedOnly: "Waymarked trails only",
    routeAllowAlpine: "Allow alpine sections (T4 and above)",
    routeUndo: "Undo",
    routeClear: "Clear",
    routeImport: "Import GPX",
    routeExport: "Download GPX",
    routeImported: "Imported track",
    routeWarnT3: "This route uses difficult sections (SAC T3 or above), shown in red on the map.",
    routeWarnT4: "This route uses alpine sections (SAC T4 or above), shown in red: for experienced, equipped hikers only.",
    routeFail: "No route found between two stops (dashed line): move a point or change the options.",
    routeNoPath: "No path near this point.",
    routeShare: "The page link contains your route: copy it to share. Nothing is sent to a server.",
    routeName: "Ododino route",
    routeRemove: "Remove this point",
    importNoEle: "This file has no elevation data: length only.",
    importError: "Unreadable GPX file.",
    offline: "Offline",
    offlineDownload: "Make available offline ({size})",
    offlineProgress: "Downloading… {p} %",
    offlineDone: "Map available offline.",
    offlineReady: "Available offline (updated {date}).",
    offlineStale: "Newer data is available.",
    offlineUpdate: "Update",
    offlineRefresh: "Download again",
    offlineRemove: "Delete",
    offlineError: "Download failed: try again with a stable connection.",
    offlineNote: "Downloads the simplified map of the area, hillshade, profiles, GPX files and route planning, to use them with no signal in the mountains. Other base maps stay online-only.",
    offlineUnavailable: "Offline pack not available on this version of the site.",
    offlineUnsupported: "This browser does not support offline use.",
    offlineNow: "You are offline: simplified map of the area.",
    baseOffline: "Offline (vector)",
    locate: "My location",
    locateDenied: "Location denied: allow it in your browser settings.",
    locateUnavailable: "Location unavailable.",
    youAreHere: "You are here (± {m} m)",
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
        <li><strong>Route planner and GPX:</strong> routes are calculated and imported GPX files are read only in your browser; nothing is sent anywhere.</li>
        <li><strong>GPS location:</strong> only if you tap “My location” and allow it in your browser; it is used only on the map on your device and never sent. <strong>Offline use:</strong> downloaded map files stay in your browser and can be deleted.</li>
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
    tabRoute: "Route",
    routeHelp: "Tippen oder klicken Sie auf die Karte für den Start, dann für die Zwischenziele: die Route folgt den Wegen. Punkte lassen sich verschieben.",
    routeLoadError: "Die Wege konnten nicht geladen werden: bitte später erneut versuchen.",
    routeLoading: "Wege werden geladen …",
    routeMarkedOnly: "Nur markierte Wanderwege",
    routeAllowAlpine: "Alpine Abschnitte erlauben (T4 und höher)",
    routeUndo: "Rückgängig",
    routeClear: "Löschen",
    routeImport: "GPX importieren",
    routeExport: "GPX herunterladen",
    routeImported: "Importierter Track",
    routeWarnT3: "Diese Route führt über schwierige Abschnitte (SAC T3 oder höher), rot auf der Karte.",
    routeWarnT4: "Diese Route führt über alpine Abschnitte (SAC T4 oder höher), rot markiert: nur für erfahrene und ausgerüstete Wanderer.",
    routeFail: "Zwischen zwei Punkten wurde keine Route gefunden (gestrichelt): Punkt verschieben oder Optionen ändern.",
    routeNoPath: "Kein Weg in der Nähe dieses Punktes.",
    routeShare: "Der Link der Seite enthält Ihre Route: kopieren Sie ihn zum Teilen. Nichts wird an einen Server gesendet.",
    routeName: "Ododino-Route",
    routeRemove: "Diesen Punkt entfernen",
    importNoEle: "Die Datei enthält keine Höhenangaben: nur die Länge.",
    importError: "GPX-Datei nicht lesbar.",
    offline: "Offline",
    offlineDownload: "Offline verfügbar machen ({size})",
    offlineProgress: "Wird heruntergeladen … {p} %",
    offlineDone: "Karte offline verfügbar.",
    offlineReady: "Offline verfügbar (aktualisiert am {date}).",
    offlineStale: "Neuere Daten sind verfügbar.",
    offlineUpdate: "Aktualisieren",
    offlineRefresh: "Erneut herunterladen",
    offlineRemove: "Löschen",
    offlineError: "Download fehlgeschlagen: bitte mit stabiler Verbindung erneut versuchen.",
    offlineNote: "Lädt die vereinfachte Karte des Gebiets, Schummerung, Profile, GPX-Dateien und den Routenplaner, um sie in den Bergen ohne Netz zu nutzen. Andere Karten bleiben nur online.",
    offlineUnavailable: "Offline-Paket in dieser Version der Website nicht verfügbar.",
    offlineUnsupported: "Dieser Browser unterstützt keine Offline-Nutzung.",
    offlineNow: "Sie sind offline: vereinfachte Karte des Gebiets.",
    baseOffline: "Offline (Vektor)",
    locate: "Mein Standort",
    locateDenied: "Standort verweigert: bitte in den Browsereinstellungen erlauben.",
    locateUnavailable: "Standort nicht verfügbar.",
    youAreHere: "Sie sind hier (± {m} m)",
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
        <li><strong>Routenplaner und GPX:</strong> Routen werden nur in Ihrem Browser berechnet und importierte GPX-Dateien nur dort gelesen; nichts wird übertragen.</li>
        <li><strong>GPS-Standort:</strong> nur wenn Sie auf „Mein Standort“ tippen und es im Browser erlauben; er wird nur auf der Karte auf Ihrem Gerät verwendet und nie übertragen. <strong>Offline-Nutzung:</strong> heruntergeladene Kartendaten bleiben in Ihrem Browser und können gelöscht werden.</li>
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
    tabRoute: "Itinéraire",
    routeHelp: "Touchez ou cliquez la carte pour placer le départ, puis les étapes : le tracé suit les chemins. Faites glisser un point pour le déplacer.",
    routeLoadError: "Impossible de charger les chemins : réessayez plus tard.",
    routeLoading: "Chargement des chemins…",
    routeMarkedOnly: "Sentiers balisés uniquement",
    routeAllowAlpine: "Autoriser les passages alpins (T4 et plus)",
    routeUndo: "Annuler",
    routeClear: "Effacer",
    routeImport: "Importer un GPX",
    routeExport: "Télécharger le GPX",
    routeImported: "Tracé importé",
    routeWarnT3: "Ce tracé emprunte des passages difficiles (SAC T3 ou plus), en rouge sur la carte.",
    routeWarnT4: "Ce tracé emprunte des passages alpins (SAC T4 ou plus), en rouge : réservé aux randonneurs expérimentés et équipés.",
    routeFail: "Aucun chemin trouvé entre deux étapes (trait pointillé) : déplacez un point ou changez les options.",
    routeNoPath: "Aucun chemin à proximité de ce point.",
    routeShare: "Le lien de la page contient votre tracé : copiez-le pour le partager. Rien n'est envoyé à un serveur.",
    routeName: "Itinéraire Ododino",
    routeRemove: "Retirer ce point",
    importNoEle: "Ce fichier ne contient pas d’altitudes : longueur seulement.",
    importError: "Fichier GPX illisible.",
    offline: "Hors ligne",
    offlineDownload: "Rendre disponible hors ligne ({size})",
    offlineProgress: "Téléchargement… {p} %",
    offlineDone: "Carte disponible hors ligne.",
    offlineReady: "Disponible hors ligne (mis à jour le {date}).",
    offlineStale: "Des données plus récentes sont disponibles.",
    offlineUpdate: "Mettre à jour",
    offlineRefresh: "Retélécharger",
    offlineRemove: "Supprimer",
    offlineError: "Échec du téléchargement : réessayez avec une connexion stable.",
    offlineNote: "Télécharge la carte simplifiée de la zone, le relief, les profils, les GPX et le calcul d'itinéraire, pour s'en servir sans réseau en montagne. Les autres fonds restent en ligne uniquement.",
    offlineUnavailable: "Pack hors ligne indisponible sur cette version du site.",
    offlineUnsupported: "Ce navigateur ne permet pas l'usage hors ligne.",
    offlineNow: "Vous êtes hors connexion : carte simplifiée de la zone.",
    baseOffline: "Hors ligne (vectoriel)",
    locate: "Ma position",
    locateDenied: "Position refusée : autorisez-la dans les réglages du navigateur.",
    locateUnavailable: "Position indisponible.",
    youAreHere: "Vous êtes ici (± {m} m)",
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
        <li><strong>Itinéraires et GPX :</strong> le calcul des tracés et la lecture des GPX importés se font uniquement dans votre navigateur ; rien n'est envoyé.</li>
        <li><strong>Position GPS :</strong> seulement si vous touchez « Ma position » et l'autorisez dans le navigateur ; elle sert uniquement à l'affichage sur votre appareil et n'est jamais envoyée. <strong>Usage hors ligne :</strong> les fichiers de carte téléchargés restent dans votre navigateur et peuvent être supprimés.</li>
        <li><strong>Liens externes</strong> (OpenStreetMap, Wikipédia, sites des lieux) : leur propre politique de confidentialité s'applique.</li>
      </ul>
      <p><strong>Vos droits :</strong> accès, rectification, effacement, limitation et opposition, en écrivant à {contact}. Vous pouvez aussi introduire une réclamation auprès de l'Autorité de protection des données belge (<a href="https://www.autoriteprotectiondonnees.be">autoriteprotectiondonnees.be</a>) ou de celle de votre pays.</p>
      <p class="muted">Dernière mise à jour : {updated}</p>`,
  },
};
