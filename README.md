# 🌌 Aurora Weather — Liquid Glass Forecast

A beautiful, interactive weather web app built with **React + Vite**, featuring a **liquid-glass UI**, a **3D backdrop that reacts to your mouse**, real-time conditions, and a full **7-day + 24-hour forecast**.

---

## ✨ Features

- 🔍 **Search any city** (press Enter or click 🔍) + quick-pick city chips
- 📍 **"My Location"** — auto-detects where you are using geolocation
- 🌡️ **Live weather** — temperature, feels-like, description & animated icon
- 📅 **7-Day Forecast** — day/date, icon, rain chance and min/max range bars
- ⏰ **Next 24 Hours** — scrollable hourly strip with temps & rain chance
- 🧭 **Today's Details** — humidity, wind + compass, pressure, visibility, UV index, precipitation, sunrise & sunset
- 🕓 **Live clock** with full date, plus the **local time** of the place you searched
- 🌡️ **°C / °F toggle**
- 🧊 **Liquid-glass design** — frosted panels, aurora background, cursor glow
- 🎇 **Interactive 3D** — glass cubes, orbs & rings that parallax with your mouse, and a hero card that tilts toward your cursor

---

## 🛠️ Tech Stack

- **React 19 + Vite**
- Plain **CSS** (glassmorphism & 3D transforms — no UI libraries)
- **OpenWeatherMap API** → current conditions
- **Open-Meteo API** → 7-day & hourly forecast (free, no key needed)

---

## 🚀 Getting Started

```bash
# 1. Clone & enter the project
git clone https://github.com/arunmeyyappanplhere/Weather-App.git
cd Weather-App

# 2. Install dependencies
npm install

# 3. Add your OpenWeatherMap API key
#    Create a .env file in the project root:
echo VITE_APP_ID=your_api_key_here > .env
#    Free key: https://openweathermap.org/api

# 4. Run it
npm run dev
```

Then open 👉 **http://localhost:5173**

---

## 📁 Project Structure

```
src/
├── assets/            # Weather icons (sun, cloud, rain, snow…)
├── components/
│   ├── Weather.jsx    # All app logic + UI
│   └── Weather.css    # Glass, aurora & 3D styling
├── App.jsx
├── index.css
└── main.jsx
```

---

## 💡 How It Works

1. You search a city (or hit **My Location**).
2. OpenWeatherMap returns the **current conditions + coordinates**.
3. Those coordinates are passed to **Open-Meteo**, which supplies the **7-day and hourly forecast**.
4. Everything renders in frosted-glass panels over an animated 3D scene — **move your mouse around and watch it respond! ✨**

---

⭐ If you like this project, give it a star on GitHub!

