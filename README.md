# MeteoFilo

Un sito meteo sviluppato con HTML, CSS e JavaScript, che permette di cercare una città oppure consultare le previsioni della propria posizione.

Ho iniziato questo progetto per esercitarmi con le API pubbliche e con JavaScript asincrono. Partendo da una semplice ricerca per città, ho aggiunto il meteo attuale, la geolocalizzazione e le previsioni orarie e settimanali.

## Funzionalità

- Ricerca delle città con suggerimenti durante la digitazione.
- Ordinamento dei risultati per vicinanza, quando la posizione dell’utente è disponibile.
- Meteo della propria posizione tramite geolocalizzazione del browser.
- Temperatura attuale, percepita, minima e massima della giornata.
- Descrizione delle condizioni meteo con icone giorno e notte.
- Velocità e direzione del vento, umidità e probabilità di precipitazioni.
- Indice UV con indicazione del livello e badge colorato.
- Previsioni per le prossime 8 ore.
- Previsioni a 7 giorni, con temperature minime e massime e barre di confronto.
- Orari di alba e tramonto e durata delle ore di luce.
- Layout adattato a desktop, tablet e smartphone.

## Tecnologie

Il progetto utilizza HTML5, CSS3 e JavaScript puro, senza framework e senza backend.

Le richieste vengono eseguite con Fetch API e `async/await`. La ricerca usa un debounce di 350 ms per limitare le chiamate durante la digitazione e `AbortController` per annullare quelle superate.

La distanza tra l’utente e le località trovate viene calcolata con la formula di Haversine. L’ordinamento viene applicato ai risultati restituiti dalla ricerca, fino a un massimo di cinque località.

## API e risorse

- [Open-Meteo](https://open-meteo.com/): dati meteo attuali e previsioni.
- [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api): ricerca delle località.
- [BigDataCloud](https://www.bigdatacloud.com/): conversione delle coordinate dell’utente nel nome della località.
- [Meteocons di Bas Milius](https://github.com/basmilius/meteocons): icone meteorologiche SVG.
- [Google Fonts](https://fonts.google.com/): font dell’interfaccia.

Nella configurazione attuale non è necessario inserire chiavi API.

## Avvio in locale

Clona la repository:

```bash
git clone https://github.com/Filo1904/meteofilo.git
cd meteofilo
```

Apri la cartella in Visual Studio Code e avvia `index.html` con l’estensione Live Server.

Non sono necessari installazione di pacchetti o passaggi di compilazione. Serve una connessione Internet per recuperare i dati dalle API.

La geolocalizzazione richiede il consenso dell’utente e un contesto sicuro: funziona su HTTPS oppure su localhost. Aprendo il sito da un altro dispositivo tramite un indirizzo IP locale in HTTP, il browser può bloccare l’accesso alla posizione. La ricerca manuale rimane disponibile.

## Organizzazione del progetto

| File o cartella | Contenuto |
| --- | --- |
| `index.html` | Struttura della pagina e sezioni meteo |
| `style.css` | Stili, componenti e adattamento alle diverse dimensioni dello schermo |
| `script.js` | Chiamate API, ricerca, geolocalizzazione e aggiornamento dell’interfaccia |
| `images/` | Immagini e icone utilizzate nel sito |

## Come vengono mostrati i dati

Le condizioni attuali provengono dai dati `current` di Open-Meteo. La probabilità di precipitazioni e l’indice UV nelle schede di dettaglio utilizzano invece il primo intervallo della previsione oraria.

Le previsioni giornaliere mostrano la probabilità massima di precipitazioni della giornata. Le barre delle temperature condividono la stessa scala settimanale, così è possibile confrontare visivamente i diversi giorni.

L’orario “Aggiornato alle” indica quando il sito ha caricato i dati, non quando è stato aggiornato il modello meteorologico.

## Cosa ho approfondito

Questo progetto mi ha permesso di lavorare su:

- utilizzo di API REST e lettura delle risposte JSON;
- gestione delle operazioni asincrone e degli errori;
- creazione e aggiornamento degli elementi del DOM;
- geolocalizzazione e calcolo delle distanze;
- gestione di date, orari e dati mancanti;
- layout con Flexbox, Grid e media query.

Il sito è ancora in sviluppo e lo sto usando per continuare a fare pratica con lo sviluppo frontend.

## Autore

[Filippo Fadda — Filo1904](https://github.com/Filo1904)

## Crediti

I dati meteorologici sono forniti da Open-Meteo, mentre la geocodifica inversa utilizza BigDataCloud.

Le icone Meteocons sono di Bas Milius e sono distribuite con licenza MIT. La loro licenza e le relative attribuzioni vanno conservate insieme ai file utilizzati.