import React from "react";
import "./Weather.css";
import serach_icon from "../assets/search.png";
import clear_icon from "../assets/clear.png";
import cloud_icon from "../assets/cloud.png";
import drizzle_icon from "../assets/drizzle.png";
import humidity_icon from "../assets/humidity.png";
import rain_icon from "../assets/rain.png";
import snow_icon from "../assets/snow.png";
import wind_icon from "../assets/wind.png";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";

const Weather = () => {
  const inputRef = useRef();

  const [weatherData, setWeatherData] = useState(false);
  const allIcons = {
    "01d": clear_icon,
    "01n": clear_icon,
    "02d": cloud_icon,
    "02d": cloud_icon,
    "03d": drizzle_icon,
    "03d": drizzle_icon,
    "04d": rain_icon,
    "04d": rain_icon,
    "09d": rain_icon,
    "09d": rain_icon,
    "10d": rain_icon,
    "10d": rain_icon,
    "13d": snow_icon,
    "13d": snow_icon,
  };
  const search = async (city) => {
    inputRef.current.value = ""
    if (city == "") {
      alert("Enter City name");
      return;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${
        import.meta.env.VITE_APP_ID
      }`;

      const response = await fetch(url);
      const data = await response.json();

      if(!response.ok){
        alert(data.message);
        return;
      }

      console.log(data);
      const icon = allIcons[data.weather[0].icon] || clear_icon;
      setWeatherData({
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        temperature: Math.floor(data.main.temp),
        location: data.name,
        icon: icon,
      });
    } catch (error) {
      setWeatherData(false);
      console.error("Error in fetching data")
    }
  };
  useEffect(() => {
    search("Trichy");
  }, []);
  return (
    <div className="weather">
      <div className="header">
        <h1 className="heading-bar">Weather Forecast Pro</h1>
      </div>
      <div className="search-bar">
        <input ref={inputRef} type="text" placeholder="Search" />
        <img
          src={serach_icon}
          alt=""
          onClick={() => search(inputRef.current.value)}
        />
      </div>
      {weatherData ? (
        <>
          <img src={weatherData.icon} alt="" className="weather-icon" />
          <p className="temperature">{weatherData.temperature}°C</p>
          <p className="location">{weatherData.location}</p>
          <div className="weather-data">
            <div className="col">
              <img src={humidity_icon} alt="" />
              <div>
                <p>{weatherData.humidity} %</p>
                <span>Humidity</span>
              </div>
            </div>
            <div className="col">
              <img src={wind_icon} alt="" />
              <div>
                <p>{weatherData.windSpeed} Km/h</p>
                <span>Wind Speed</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Weather;
