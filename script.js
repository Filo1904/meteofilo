const searchForm = document.querySelector("#search-form");
const resultTitle = document.querySelector("#result-title");
const resultSubtitle = document.querySelector("#result-subtitle");
const resultBox = document.getElementById("result-box");
const welcome = document.getElementById("welcome");
const welcomeStatus = document.getElementById("welcome-status");

function getDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const earthRadius = 6371; // km

    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(deltaLon / 2) ** 2;

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(Math.max(0, 1 - a))
    );

    return earthRadius * c;
}

function getUserPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            (error) => reject(error),
            { timeout: 10000 }
        );
    });
}

const searchBar = document.getElementById("city-search");
const cityResults = document.getElementById("city-results");

let searchTimeout;
let searchController;
let userCoords = null;

searchBar.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchController?.abort();

    const city = searchBar.value.trim();

    cityResults.replaceChildren();
    cityResults.hidden = true;

    if (city.length < 2) return;

    searchTimeout = setTimeout(() => {
        searchCities(city);
    }, 350);
});

async function searchCities(city) {
    const controller = new AbortController();
    searchController = controller;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=it`;

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Ignora una ricerca superata da nuovo testo
        if (controller.signal.aborted) return;

        const locations = data.results ?? [];

        if (locations.length > 0 && !userCoords) {
            try {
                userCoords = await getUserPosition();
            } catch (error) {
                console.warn("Posizione non disponibile:", error.message);
            }
        }

        // Durante l'attesa l'utente potrebbe aver cambiato ricerca
        if (controller.signal.aborted) return;

        if (userCoords) {
            locations.forEach((location) => {
                location.distance = getDistance(
                    userCoords.latitude,
                    userCoords.longitude,
                    location.latitude,
                    location.longitude
                );
            });

            locations.sort((a, b) => a.distance - b.distance);
        }

        cityResults.replaceChildren();

        locations.forEach((location) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "city-result";

            const name = document.createElement("span");
            name.className = "city-result-name";
            name.textContent = location.name;

            const info = document.createElement("span");
            info.className = "city-result-info";
            info.textContent = [
                location.admin1,
                location.country
            ].filter(Boolean).join(", ");

            button.append(name, info);

            button.addEventListener("click", () => {
                searchBar.value = location.name;
                cityResults.hidden = true;

                getWeather(
                    location.latitude,
                    location.longitude,
                    location.name,
                    location.admin1,
                    location.country
                );
            });

            cityResults.appendChild(button);
        });

        cityResults.hidden = locations.length === 0;
    } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Errore ricerca città:", error);
        cityResults.replaceChildren();
        cityResults.hidden = true;
    }
}

document.addEventListener("click", (event) => {
    if (!event.target.closest(".city-search-container")) {
        cityResults.hidden = true;
    }
});

searchBar.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        cityResults.hidden = true;
    }
});

searchBar.addEventListener("focus", () => {
    cityResults.hidden = cityResults.childElementCount === 0;
});

function getWeatherCode(code) {
    const descriptions = {
        0: "Cielo sereno",
        1: "Prevalentemente sereno",
        2: "Parzialmente nuvoloso",
        3: "Coperto",

        45: "Nebbia",
        48: "Nebbia con deposito di brina",

        51: "Pioviggine leggera",
        53: "Pioviggine moderata",
        55: "Pioviggine intensa",
        56: "Pioviggine gelata leggera",
        57: "Pioviggine gelata intensa",

        61: "Pioggia leggera",
        63: "Pioggia moderata",
        65: "Pioggia forte",
        66: "Pioggia gelata leggera",
        67: "Pioggia gelata forte",

        71: "Nevicata leggera",
        73: "Nevicata moderata",
        75: "Nevicata forte",
        77: "Neve granulare",

        80: "Rovesci di pioggia leggeri",
        81: "Rovesci di pioggia moderati",
        82: "Rovesci di pioggia violenti",
        85: "Rovesci di neve leggeri",
        86: "Rovesci di neve forti",

        95: "Temporale",
        96: "Temporale con grandine leggera",
        97: "Temporale forte",
        99: "Temporale con grandine forte"
    };

    return descriptions[code] ?? "Condizioni non disponibili";
}

function getWeatherIcon(code, isDay) {
    const period = isDay === 1 ? "day" : "night";

    const icons = {
        0: `clear-${period}`,
        1: `clear-${period}`,
        2: `partly-cloudy-${period}`,
        3: `overcast-${period}`,

        45: `fog-${period}`,
        48: `fog-${period}`,

        51: "drizzle",
        53: "drizzle",
        55: "drizzle",
        56: "sleet",
        57: "sleet",

        61: "rain",
        63: "rain",
        65: "rain",
        66: "sleet",
        67: "sleet",

        71: "snow",
        73: "snow",
        75: "snow",
        77: "snow",

        80: `partly-cloudy-${period}-rain`,
        81: `partly-cloudy-${period}-rain`,
        82: `partly-cloudy-${period}-rain`,

        85: `partly-cloudy-${period}-snow`,
        86: `partly-cloudy-${period}-snow`,

        95: `thunderstorms-${period}-rain`,
        96: "thunderstorms",
        97: `thunderstorms-${period}-rain`,
        99: "thunderstorms"
    };

    const icon = icons[code];

    return icon
        ? `images/weather/${icon}.svg`
        : "images/weather/not-available.svg";
}

function getWindDirection(degrees) {
    const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

    return directions[Math.round(degrees / 45) % 8];
}

function renderHourlyForecast(data) {
    const hourlyList = document.getElementById("hourly-list");
    const hourlyMessage = document.getElementById("hourly-message");
    const hourly = data.hourly ?? {};
    const times = (hourly.time ?? []).slice(0, 8);

    hourlyList.replaceChildren();
    hourlyList.parentElement.scrollLeft = 0;
    hourlyMessage.hidden = times.length > 0;

    times.forEach((time, index) => {
        const item = document.createElement("li");
        item.className = "hourly-item";

        // La prima colonna usa gli stessi dati attuali della scheda principale.
        const temperature = index === 0
            ? data.current.temperature_2m : hourly.temperature_2m?.[index];
        const code = index === 0
            ? data.current.weather_code : hourly.weather_code?.[index];
        const isDay = index === 0
            ? data.current.is_day : hourly.is_day?.[index];
        const probability = hourly.precipitation_probability?.[index];

        const hourLabel = document.createElement("time");
        hourLabel.className = "hourly-time";
        hourLabel.dateTime = index === 0 ? data.current.time : time;
        // I timestamp sono già nell'ora locale della città: non vanno convertiti.
        hourLabel.textContent = index === 0 ? "Adesso" : time.slice(11, 16);
        hourLabel.title = `${time.slice(8, 10)}/${time.slice(5, 7)} · ${time.slice(11, 16)}`;

        const icon = document.createElement("img");
        icon.className = "hourly-weather-icon";
        icon.src = getWeatherIcon(code, isDay);
        icon.alt = getWeatherCode(code);

        const temperatureText = document.createElement("p");
        temperatureText.className = "hourly-temperature";
        temperatureText.textContent = Number.isFinite(temperature)
            ? `${Math.round(temperature)}°` : "—";

        const precipitation = document.createElement("p");
        precipitation.className = "hourly-precipitation";
        const probabilityText = Number.isFinite(probability) ? `${probability}%` : "—";
        precipitation.setAttribute("aria-label", Number.isFinite(probability)
            ? `Probabilità di precipitazioni: ${probabilityText}`
            : "Probabilità di precipitazioni non disponibile");
        precipitation.title = "Probabilità di precipitazioni";

        const drop = document.createElement("img");
        drop.src = "images/weather/raindrop.svg";
        drop.alt = "";

        const percentage = document.createElement("span");
        percentage.textContent = probabilityText;
        precipitation.append(drop, percentage);

        item.append(hourLabel, icon, temperatureText, precipitation);
        hourlyList.appendChild(item);
    });
}

function renderDailyForecast(data) {
    const dailyList = document.getElementById("daily-list");
    const dailyMessage = document.getElementById("daily-message");
    const daily = data.daily ?? {};
    const dates = (daily.time ?? []).slice(0, 7);
    const minimums = (daily.temperature_2m_min ?? []).slice(0, 7);
    const maximums = (daily.temperature_2m_max ?? []).slice(0, 7);
    const temperatures = [...minimums, ...maximums].filter(Number.isFinite);
    const weekMin = Math.min(...temperatures);
    const weekMax = Math.max(...temperatures);

    dailyList.replaceChildren();
    dailyMessage.hidden = dates.length > 0;

    dates.forEach((date, index) => {
        const row = document.createElement("li");
        row.className = "daily-row";

        // La data identifica un giorno della città, senza conversioni al fuso del browser.
        const weekday = new Intl.DateTimeFormat("it-IT", {
            weekday: "long", timeZone: "UTC"
        }).format(new Date(`${date}T12:00:00Z`));
        const day = document.createElement("time");
        day.className = "daily-day";
        day.dateTime = date;
        day.textContent = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        day.title = `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

        const icon = document.createElement("img");
        icon.className = "daily-weather-icon";
        // Il riepilogo giornaliero usa sempre la variante diurna.
        icon.src = getWeatherIcon(daily.weather_code?.[index], 1);
        icon.alt = getWeatherCode(daily.weather_code?.[index]);

        const probability = daily.precipitation_probability_max?.[index];
        const precipitation = document.createElement("span");
        precipitation.className = "daily-precipitation";
        precipitation.title = "Probabilità massima di precipitazioni nella giornata";
        precipitation.setAttribute("aria-label", Number.isFinite(probability)
            ? `Probabilità massima di precipitazioni: ${probability}%`
            : "Probabilità di precipitazioni non disponibile");
        const drop = document.createElement("img");
        drop.src = "images/weather/raindrop.svg";
        drop.alt = "";
        const percentage = document.createElement("span");
        percentage.textContent = Number.isFinite(probability) ? `${probability}%` : "—";
        precipitation.append(drop, percentage);

        const min = minimums[index];
        const max = maximums[index];
        const minText = document.createElement("span");
        minText.className = "daily-min";
        minText.textContent = Number.isFinite(min) ? `${Math.round(min)}°` : "—";
        minText.setAttribute("aria-label", Number.isFinite(min)
            ? `Minima ${Math.round(min)} gradi` : "Minima non disponibile");
        const maxText = document.createElement("span");
        maxText.className = "daily-max";
        maxText.textContent = Number.isFinite(max) ? `${Math.round(max)}°` : "—";
        maxText.setAttribute("aria-label", Number.isFinite(max)
            ? `Massima ${Math.round(max)} gradi` : "Massima non disponibile");

        const range = document.createElement("span");
        range.className = "daily-range";
        range.setAttribute("aria-hidden", "true");
        const fill = document.createElement("span");
        fill.className = "daily-range-fill";
        const validRange = Number.isFinite(min) && Number.isFinite(max) && min <= max;
        range.hidden = !validRange;
        if (validRange) {
            // Tutte le barre condividono la scala minima/massima della settimana.
            const span = weekMax - weekMin;
            const left = span > 0 ? (min - weekMin) / span * 100 : 0;
            fill.style.left = `${Math.min(left, 98)}%`;
            fill.style.width = `${span > 0 ? Math.max((max - min) / span * 100, 2) : 100}%`;
        }
        range.appendChild(fill);

        row.append(day, icon, precipitation, minText, range, maxText);
        dailyList.appendChild(row);
    });
}

function renderSunlight(data) {
    const daily = data.daily ?? {};
    const today = data.current?.time?.slice(0, 10);
    const index = (daily.time ?? []).indexOf(today);
    const sunrise = daily.sunrise?.[index];
    const sunset = daily.sunset?.[index];
    const duration = daily.daylight_duration?.[index];
    const sunriseText = document.getElementById("sunrise-time");
    const sunsetText = document.getElementById("sunset-time");
    const daylightText = document.getElementById("daylight-duration");
    const message = document.getElementById("sun-message");

    // Anche alba e tramonto sono già espressi nell'ora locale della città.
    sunriseText.textContent = sunrise ? sunrise.slice(11, 16) : "—";
    sunsetText.textContent = sunset ? sunset.slice(11, 16) : "—";
    const validDuration = Number.isFinite(duration) && duration >= 0;
    if (validDuration) {
        const totalMinutes = Math.round(duration / 60);
        daylightText.textContent = `${Math.floor(totalMinutes / 60)} h ${String(totalMinutes % 60).padStart(2, "0")} min`;
    } else {
        daylightText.textContent = "—";
    }

    message.hidden = Boolean(sunrise && sunset && validDuration && duration > 0 && duration < 86400);
    message.textContent = validDuration && duration === 0
        ? "Oggi il sole non sorge in questa località."
        : validDuration && duration >= 86400
            ? "Oggi il sole non tramonta in questa località."
            : "Alcuni dati del sole non sono disponibili per questa località.";
}

async function getWeather(
        latitude,
        longitude,
        cityName,
        regionName,
        countryName
    ) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day,precipitation_probability,uv_index&daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,sunrise,sunset,daylight_duration&forecast_hours=8&forecast_days=7&timezone=auto`;

    resultTitle.textContent = `Caricamento del meteo di ${cityName}…`;
    welcomeStatus.textContent = `Caricamento del meteo di ${cityName}…`;

    try {
        const response = await fetch(url)

        if (!response.ok)
        {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json()

        const date = new Date();

        const formattedDate = new Intl.DateTimeFormat("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long"
        }).format(date);

        const displayDate = formattedDate.replace(
            /\p{L}+/gu,
            word => word.charAt(0).toUpperCase() + word.slice(1)
        );


        resultTitle.textContent = `Il meteo a ${cityName}`
        resultSubtitle.textContent = `${regionName}, ${countryName} • ${displayDate}`

        const currentTemperatureText = document.getElementById("current-temperature-text")
        currentTemperatureText.textContent = `${Math.round(data.current.temperature_2m)}°`
        
        const currentWeatherCode = document.querySelector(".current-weather-code");
        currentWeatherCode.textContent = getWeatherCode(data.current.weather_code);

        const currentWeatherIcon = document.getElementById("current-weather-icon");

        currentWeatherIcon.src = getWeatherIcon(
            data.current.weather_code,
            data.current.is_day
        );

currentWeatherIcon.alt = getWeatherCode(data.current.weather_code);

        const currentApparentTemperatureText = document.getElementById("current-apparent-temperature")
        currentApparentTemperatureText.textContent = `Percepita ${Math.round(data.current.apparent_temperature)}°`

        const todayIndex = (data.daily?.time ?? []).indexOf(data.current.time.slice(0, 10));
        const todayMax = data.daily?.temperature_2m_max?.[todayIndex];
        const todayMin = data.daily?.temperature_2m_min?.[todayIndex];
        const maxText = Number.isFinite(todayMax) ? `${Math.round(todayMax)}°` : "—";
        const minText = Number.isFinite(todayMin) ? `${Math.round(todayMin)}°` : "—";
        document.getElementById("current-temperature-range").textContent =
            `Max ${maxText} · Min ${minText}`;

        const windSpeedText = document.getElementById("wind-speed")
        windSpeedText.textContent = `${Math.round(data.current.wind_speed_10m)} km/h`

        const windDirectionText = document.getElementById("wind-direction") 
        const windDirection = getWindDirection(data.current.wind_direction_10m)
        windDirectionText.textContent = `${windDirection}`

        const humidityText = document.getElementById("humidity")
        humidityText.textContent = `${data.current.relative_humidity_2m}%`

        const rainProbabilityText = document.getElementById("rain-probability");
        const rainProbability = data.hourly.precipitation_probability[0];

        rainProbabilityText.textContent =
            rainProbability != null ? `${rainProbability}%` : "—";


        const uvIndexText = document.getElementById("uv-index");
        const uvDescriptionText = document.getElementById("uv-description");
        const uvIndex = data.hourly.uv_index[0];

        uvIndexText.textContent =
            uvIndex != null ? uvIndex.toFixed(1) : "—";

        let uvLevel;

        if (uvIndex == null) {
            uvDescriptionText.textContent = "Non disponibile";
            uvLevel = "unavailable";
        } else if (uvIndex < 3) {
            uvDescriptionText.textContent = "Basso";
            uvLevel = "low";
        } else if (uvIndex < 6) {
            uvDescriptionText.textContent = "Moderato";
            uvLevel = "moderate";
        } else if (uvIndex < 8) {
            uvDescriptionText.textContent = "Alto";
            uvLevel = "high";
        } else if (uvIndex < 11) {
            uvDescriptionText.textContent = "Molto alto";
            uvLevel = "very-high";
        } else {
            uvDescriptionText.textContent = "Estremo";
            uvLevel = "extreme";
        }

        uvDescriptionText.className = `uv-badge uv-${uvLevel}`;
        
        const updateTime = new Intl.DateTimeFormat("it-IT", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date());

        document.getElementById("weather-update-time").textContent =
            `⟳ Aggiornato alle ${updateTime}`;
        
        renderHourlyForecast(data);
        renderDailyForecast(data);
        renderSunlight(data);

        welcome.hidden = true;
        resultBox.hidden = false;
        welcomeStatus.textContent = "";
        
    } catch (error) {
        console.error(error);
        resultTitle.textContent = "Impossibile caricare il meteo. Riprova.";
        welcomeStatus.textContent = "Impossibile caricare il meteo. Riprova scegliendo una città o usando la tua posizione.";
    }
}

async function getCityFromCoordinates(latitude, longitude) {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=it`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Errore geocodifica: ${response.status}`);
    }

    const data = await response.json();

    console.log("Località rilevata:", data);

    return {
        city: data.city || data.locality || "La mia posizione",
        region: data.principalSubdivision,
        country: data.countryName
    };
}



const myPositionButton = document.getElementById("my-position-button")

myPositionButton.addEventListener("click", async () => {
    try {
        myPositionButton.disabled = true;
        myPositionButton.textContent = "Localizzazione...";
        welcomeStatus.textContent = "Ricerca della tua posizione…";

        const coords = await getUserPosition();
        userCoords = coords;

        const place = await getCityFromCoordinates(
            coords.latitude,
            coords.longitude
        );
        console.log(place)
        await getWeather(
            coords.latitude,
            coords.longitude,
            place.city,
            place.region,
            place.country
        );
    } catch (error) {
        console.log(error);
        welcomeStatus.textContent = "Posizione non disponibile. Puoi cercare una città nella barra in alto.";
    } finally {
        myPositionButton.disabled = false;
        myPositionButton.textContent = "⊙ La mia posizione";
    }
});
