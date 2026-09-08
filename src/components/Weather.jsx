import React, { useEffect, useState, useRef, useCallback } from "react";
import "./Weather.css";

import search_icon from "../assets/search.png";
import clear_icon from "../assets/clear.png";
import cloud_icon from "../assets/cloud.png";
import drizzle_icon from "../assets/drizzle.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";

const APPID = import.meta.env.VITE_APP_ID;

/* OpenWeatherMap icon codes -> local assets (fixed: no duplicate keys) */
const OWM_ICONS = {
  "01d": clear_icon, "01n": clear_icon,
  "02d": cloud_icon, "02n": cloud_icon,
  "03d": cloud_icon, "03n": cloud_icon,
  "04d": cloud_icon, "04n": cloud_icon,
  "09d": drizzle_icon, "09n": drizzle_icon,
  "10d": rain_icon, "10n": rain_icon,
  "11d": rain_icon, "11n": rain_icon,
  "13d": snow_icon, "13n": snow_icon,
  "50d": cloud_icon, "50n": cloud_icon,
};

/* WMO weather codes (Open-Meteo) -> label + icon */
const WMO = {
  0: ["Clear sky", clear_icon], 1: ["Mainly clear", clear_icon],
  2: ["Partly cloudy", cloud_icon], 3: ["Overcast", cloud_icon],
  45: ["Fog", cloud_icon], 48: ["Rime fog", cloud_icon],
  51: ["Light drizzle", drizzle_icon], 53: ["Drizzle", drizzle_icon], 55: ["Heavy drizzle", drizzle_icon],
  56: ["Freezing drizzle", drizzle_icon], 57: ["Freezing drizzle", drizzle_icon],
  61: ["Light rain", rain_icon], 63: ["Rain", rain_icon], 65: ["Heavy rain", rain_icon],
  66: ["Freezing rain", rain_icon], 67: ["Freezing rain", rain_icon],
  71: ["Light snow", snow_icon], 73: ["Snow", snow_icon], 75: ["Heavy snow", snow_icon],
  77: ["Snow grains", snow_icon],
  80: ["Light showers", rain_icon], 81: ["Showers", rain_icon], 82: ["Violent showers", rain_icon],
  85: ["Snow showers", snow_icon], 86: ["Snow showers", snow_icon],
  95: ["Thunderstorm", rain_icon], 96: ["Storm with hail", rain_icon], 99: ["Storm with hail", rain_icon],
};
const wmoIcon = (c) => (WMO[c] ? WMO[c][1] : cloud_icon);
const wmoLabel = (c) => (WMO[c] ? WMO[c][0] : "Unknown");

const QUICK_CITIES = ["London", "New York", "Tokyo", "Paris", "Dubai", "Sydney", "Chennai"];

const uvLabel = (uv) =>
  uv <= 2 ? "Low" : uv <= 5 ? "Moderate" : uv <= 7 ? "High" : uv <= 10 ? "Very High" : "Extreme";

const windDir = (deg) => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
};

/* "YYYY-MM-DDTHH:MM" -> "HH:MM" (Open-Meteo returns place-local wall time) */
const hhmm = (iso) => (iso ? iso.slice(11, 16) : "--:--");

const Weather = () => {
  const inputRef = useRef(null);
  const heroRef = useRef(null);

  const [current, setCurrent] = useState(null);   // OpenWeatherMap current conditions
  const [place, setPlace] = useState("");
  const [days, setDays] = useState([]);           // 7-day forecast (Open-Meteo)
  const [hours, setHours] = useState([]);         // next 24h (Open-Meteo)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("C");
  const [now, setNow] = useState(new Date());
  const [locating, setLocating] = useState(false);

  const temp = (celsius) =>
    Math.round(unit === "C" ? celsius : celsius * 1.8 + 32);

  /* ---------- data loading ---------- */

  const loadAll = useCallback(async (lat, lon, presetCurrent = null) => {
    setLoading(true);
    setError("");
    try {
      let cd = presetCurrent;
      if (!cd) {
        const r = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${APPID}`
        );
        cd = await r.json();
        if (!r.ok) throw new Error(cd.message || "Could not load current weather");
      }
      setPlace(cd.name || "My location");
      setCurrent({
        temperature: cd.main.temp,
        feelsLike: cd.main.feels_like,
        humidity: cd.main.humidity,
        pressure: cd.main.pressure,
        windSpeed: cd.wind.speed,
        windDeg: cd.wind.deg ?? 0,
        visibility: cd.visibility ?? 0,
        description: cd.weather?.[0]?.description ?? "",
        icon: OWM_ICONS[cd.weather?.[0]?.icon] || clear_icon,
        sunrise: hhmm(new Date((cd.sys.sunrise + cd.timezone) * 1000).toISOString()),
        sunset: hhmm(new Date((cd.sys.sunset + cd.timezone) * 1000).toISOString()),
        timezone: cd.timezone ?? 0,
        clouds: cd.clouds?.all ?? 0,
      });

      const f = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&hourly=temperature_2m,weather_code,precipitation_probability` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max` +
          `&timezone=auto&forecast_days=7`
      );
      const fd = await f.json();
      if (!f.ok) throw new Error("Forecast service unavailable");

      setDays(
        (fd.daily?.time || []).map((d, i) => ({
          date: d, // "YYYY-MM-DD"
          max: fd.daily.temperature_2m_max[i],
          min: fd.daily.temperature_2m_min[i],
          code: fd.daily.weather_code[i],
          pop: fd.daily.precipitation_probability_max?.[i] ?? 0,
          uv: fd.daily.uv_index_max?.[i] ?? 0,
        }))
      );

      // next 24 hours starting from the current hour
      const stamp = new Date();
      stamp.setMinutes(0, 0, 0);
      const t = fd.hourly?.time || [];
      let idx = t.findIndex((x) => new Date(x).getTime() >= stamp.getTime());
      if (idx < 0) idx = 0;
      setHours(
        t.slice(idx, idx + 24).map((x, i) => ({
          time: hhmm(x),
          temp: fd.hourly.temperature_2m[idx + i],
          code: fd.hourly.weather_code[idx + i],
          pop: fd.hourly.precipitation_probability?.[idx + i] ?? 0,
        }))
      );
    } catch (e) {
      setCurrent(null);
      setDays([]);
      setHours([]);
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const search = async (city) => {
    const q = (city || "").trim();
    if (!q) {
      setError("Please enter a city name.");
      return;
    }
    if (inputRef.current) inputRef.current.value = "";
    setLoading(true);
    setError("");
    try {
      const r = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${APPID}`
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "City not found");
      await loadAll(d.coord.lat, d.coord.lon, d);
    } catch (e) {
      setLoading(false);
      setError(e.message || "City not found");
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        loadAll(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setError("Location permission was denied.");
      }
    );
  };

  useEffect(() => {
    loadAll(10.7905, 78.7047); // default city (Trichy)
  }, [loadAll]);

  /* live clock */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* mouse-driven 3D parallax -> CSS variables on :root */
  useEffect(() => {
    const onMove = (e) => {
      const root = document.documentElement;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      root.style.setProperty("--rx", x.toFixed(3));
      root.style.setProperty("--ry", y.toFixed(3));
      root.style.setProperty("--mx", e.clientX + "px");
      root.style.setProperty("--my", e.clientY + "px");
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const onHeroMove = (e) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--hx", (px * 7).toFixed(2) + "deg");
    el.style.setProperty("--hy", (-py * 7).toFixed(2) + "deg");
    el.style.setProperty("--shine", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
  };
  const onHeroLeave = () => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--hx", "0deg");
    el.style.setProperty("--hy", "0deg");
  };

  /* ---------- derived display values ---------- */
  const clock = now.toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const dateStr = now.toLocaleDateString([], {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  /* wall-clock time at the searched place */
  let placeTime = "--:--";
  if (current) {
    const utcMs = Date.now() + now.getTimezoneOffset() * 60000;
    placeTime = new Date(utcMs + current.timezone * 1000).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit",
    });
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const tomorrowISO = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayName = (d) =>
    d === todayISO ? "Today"
    : d === tomorrowISO ? "Tomorrow"
    : new Date(d + "T12:00:00").toLocaleDateString([], { weekday: "short" });
  const dayDate = (d) =>
    new Date(d + "T12:00:00").toLocaleDateString([], { day: "numeric", month: "short" });

  /* overall min/max across the week, used for the temperature range bars */
  const weekMin = days.length ? Math.min(...days.map((d) => d.min)) : 0;
  const weekMax = days.length ? Math.max(...days.map((d) => d.max)) : 1;
  const pct = (v) =>
    Math.max(4, Math.min(100, ((v - weekMin) / Math.max(1, weekMax - weekMin)) * 100));

  /* ---------- 3D backdrop shapes ---------- */
  const shapes = [
    { kind: "cube", d: 34, style: { top: "8%", left: "6%" } },
    { kind: "cube", d: -26, style: { bottom: "10%", right: "8%" } },
    { kind: "orb", d: 22, style: { top: "18%", right: "12%" } },
    { kind: "orb", d: -18, style: { bottom: "22%", left: "10%" } },
    { kind: "ring", d: 40, style: { top: "55%", left: "16%" } },
    { kind: "ring", d: -34, style: { top: "12%", left: "42%" } },
    { kind: "diamond", d: 28, style: { bottom: "8%", left: "45%" } },
    { kind: "orb", d: 46, style: { top: "70%", right: "20%" } },
  ];

  return (
    <div className="page">
      {/* animated liquid-glass backdrop with mouse-parallax 3D shapes */}
      <div className="backdrop" aria-hidden="true">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <div className="cursor-glow" />
        <div className="scene">
          {shapes.map((s, i) => (
            <div key={i} className={`shape ${s.d > 0 ? "near" : "far"}`} style={{ ...s.style, "--d": s.d / 10 }}>
              <div className="floaty" style={{ animationDelay: `${i * -1.7}s` }}>
                {s.kind === "cube" && (
                  <div className="cube">
                    <div className="face f1" /><div className="face f2" />
                    <div className="face f3" /><div className="face f4" />
                    <div className="face f5" /><div className="face f6" />
                  </div>
                )}
                {s.kind === "orb" && <div className="orb" />}
                {s.kind === "ring" && <div className="ring" />}
                {s.kind === "diamond" && <div className="diamond" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* top bar: brand, live clock, controls */}
      <header className="topbar glass">
        <div className="brand">
          <span className="brand-dot" />
          <span>Aurora&nbsp;Weather</span>
        </div>
        <div className="clockbox">
          <p className="clock">{clock}</p>
          <p className="date">{dateStr}</p>
        </div>
        <div className="topbar-actions">
          <button className="btn glass-btn" onClick={locateMe} disabled={locating}>
            {locating ? "Locating…" : "📍 My location"}
          </button>
          <div className="unit-toggle">
            <button className={unit === "C" ? "active" : ""} onClick={() => setUnit("C")}>°C</button>
            <button className={unit === "F" ? "active" : ""} onClick={() => setUnit("F")}>°F</button>
          </div>
        </div>
      </header>

      <main className="layout">
        {/* hero: search + current conditions + hourly */}
        <section className="hero glass" ref={heroRef} onMouseMove={onHeroMove} onMouseLeave={onHeroLeave}>
          <div className="search-bar">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search any city…"
              onKeyDown={(e) => e.key === "Enter" && search(inputRef.current.value)}
            />
            <img
              src={search_icon}
              alt="Search"
              onClick={() => search(inputRef.current.value)}
            />
          </div>
          <div className="chips">
            {QUICK_CITIES.map((c) => (
              <button key={c} className="chip" onClick={() => search(c)}>{c}</button>
            ))}
          </div>

          {error && (
            <div className="state error">
              <span>⚠️ {error}</span>
              <button className="chip" onClick={() => loadAll(10.7905, 78.7047)}>Try again</button>
            </div>
          )}

          {loading && <div className="state"><div className="spinner" /><p>Loading weather…</p></div>}

          {!loading && current && (
            <div className="hero-body">
              <div className="hero-main">
                <img src={current.icon} alt={current.description} className="weather-icon" />
                <div>
                  <p className="temperature">{temp(current.temperature)}°</p>
                  <p className="description">{current.description}</p>
                </div>
              </div>
              <div className="hero-meta">
                <p className="location"><span className="pin">📍</span> {place}</p>
                <p className="meta-line">🕓 Local time {placeTime}</p>
                <p className="meta-line">
                  Feels like {temp(current.feelsLike)}° ·
                  H {temp(Math.max(current.temperature, days[0]?.max ?? current.temperature))}° /
                  L {temp(Math.min(current.temperature, days[0]?.min ?? current.temperature))}°
                </p>
              </div>

              <div className="hourly-wrap">
                <h3>Next 24 hours</h3>
                <div className="hourly">
                  {hours.map((h, i) => (
                    <div key={i} className="hour glass-tile">
                      <span className="h-time">{i === 0 ? "Now" : h.time}</span>
                      <img src={wmoIcon(h.code)} alt="" />
                      <span className="h-temp">{temp(h.temp)}°</span>
                      <span className="h-pop">{h.pop > 0 ? `${h.pop}%` : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 7-day forecast */}
        <section className="week glass">
          <div className="section-head">
            <h2>7-Day Forecast</h2>
            <span className="hint">{place}</span>
          </div>
          {!loading && (
            <div className="week-grid">
              {days.map((d) => (
                <div key={d.date} className={`day glass-tile ${d.date === todayISO ? "today" : ""}`}>
                  <span className="d-name">{dayName(d.date)}</span>
                  <span className="d-date">{dayDate(d.date)}</span>
                  <img src={wmoIcon(d.code)} alt={wmoLabel(d.code)} title={wmoLabel(d.code)} />
                  <span className="d-pop">{d.pop > 0 ? `💧 ${d.pop}%` : "\u00A0"}</span>
                  <div className="range">
                    <div
                      className="range-fill"
                      style={{ left: `${pct(d.min)}%`, right: `${100 - pct(d.max)}%` }}
                    />
                  </div>
                  <div className="temps">
                    <span className="t-max">{temp(d.max)}°</span>
                    <span className="t-min">{temp(d.min)}°</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* details grid */}
        {!loading && current && (
          <section className="details glass">
            <div className="section-head">
              <h2>Today's Details</h2>
              <span className="hint">{wmoLabel(days[0]?.code ?? 0)}</span>
            </div>
            <div className="details-grid">
              <div className="detail glass-tile">
                <span className="d-icon">🌡️</span>
                <div><p>{temp(current.feelsLike)}°</p><span>Feels like</span></div>
              </div>
              <div className="detail glass-tile">
                <span className="d-icon">💧</span>
                <div><p>{current.humidity}%</p><span>Humidity</span></div>
              </div>
              <div className="detail glass-tile">
                <span className="d-icon">🌬️</span>
                <div>
                  <p>
                    {current.windSpeed} km/h
                    <em className="compass" style={{ transform: `rotate(${current.windDeg}deg)` }}>↑</em>
                    <small>{windDir(current.windDeg)}</small>
                  </p>
                  <span>Wind</span>
                </div>
              </div>
              <div className="detail glass-tile">
                <span className="d-icon">🧭</span>
                <div><p>{current.pressure} hPa</p><span>Pressure</span></div>
              </div>
              <div className="detail glass-tile">
                <span className="d-icon">👁️</span>
                <div><p>{(current.visibility / 1000).toFixed(1)} km</p><span>Visibility</span></div>
              </div>
              <div className="detail glass-tile">
                <span className="d-icon">🔆</span>
                <div><p>{(days[0]?.uv ?? 0).toFixed(1)} · {uvLabel(days[0]?.uv ?? 0)}</p><span>UV index</span></div>
              </div>
              <div className="detail glass-tile">
                <span className="d-icon">☔</span>
                <div><p>{days[0]?.pop ?? 0}%</p><span>Precipitation</span></div>
              </div>
              <div className="detail glass-tile">
                <span className="d-icon">🌅</span>
                <div><p>{current.sunrise}</p><span>Sunrise</span></div>
              </div>
              <div className="detail glass-tile">
                <span className="d-icon">🌇</span>
                <div><p>{current.sunset}</p><span>Sunset</span></div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Data: OpenWeatherMap · Open-Meteo — move your mouse around ✨</p>
      </footer>
    </div>
  );
};

export default Weather;