import { useState, useEffect } from "react";

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

// THIS FUNCTION GETS THE COUNTRY CODE FROM THE GEODATA AND CONVERTS IT TO A FLAG

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

export default function App() {
  const [location, setLocation] = useState("italy");
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState("");
  const [weather, setWeather] = useState({});

  useEffect(() => {
    fetchweather();
  }, []);

  async function fetchweather() {
    try {
      // 1) Getting location (geocoding)
      //  ---------------------------------
      setIsLoading(true);
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`
      );

      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);

      setDisplayLocation({ name, country_code: convertToFlag(country_code) });

      console.log(displayLocation);

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      setWeather({ weather: weatherData.daily });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }
  console.log(weather);

  return (
    <div className='app'>
      <h1>class weather</h1>
      <div>
        <input
          type='text'
          value={location}
          placeholder='Search from location...'
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <button onClick={fetchweather}>get weather</button>
      {isLoading && <p className='loader'>loading&#46;&#46;&#46;</p>}

      {weather.weather && (
        <Weather weather={weather.weather} location={displayLocation} />
      )}
    </div>
  );
}

function Weather({ weather, location }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  console.log(dates);

  return (
    <div>
      <h2>weather&nbsp;&nbsp;{location.country_code}</h2>
      <ul className='weather'>
        {dates.map((day, i) => (
          <Day
            date={day}
            max={max[i]}
            min={min[i]}
            code={codes[i]}
            key={day}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, max, min, code, isToday }) {
  return (
    <>
      <li>
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? "Today" : formatDay(date)}</p>
        <p>
          {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
        </p>
      </li>
    </>
  );
}
