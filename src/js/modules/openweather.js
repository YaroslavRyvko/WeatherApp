export function initOpenWeather() {
    const key = '9ceb3c3e067e14e0f6b76185c8ce3aee';
    const lang = 'en';
    const units = 'metric';
    const cities = ['Kyiv', 'Kharkiv', 'Odesa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Luhansk', 'Vinnytsia', 'Chernihiv', 'Kherson', 'Poltava', 'Cherkasy', 'Khmelnytskyi', 'Zhytomyr', 'Sumy', 'Rivne', 'Ivano-Frankivsk', 'Ternopil', 'Lutsk', 'Simferopol', 'Chernivtsi'];

    if (!document.querySelector('.home-page')) return;

    // Get weather from random Ukraine cities
    function fetchWeatherRandom() {
        let arr = getMultipleRandom(cities, 3);
        arr.forEach((city) => {
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=${units}&lang=${lang}`)
                .then((resp) => {
                    if (!resp.ok) throw new Error(resp.statusText);
                    return resp.json();
                })
                .then((data) => {
                    showWeather(data);
                })
                .catch(console.err);
        })

    };

    function getMultipleRandom(arr, num) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, num);
    }

    fetchWeatherRandom();

    //Get weather from specific city 
    let searchForm = document.querySelector('.search');
    searchForm.addEventListener('submit', fetchWeatherCity);

    function fetchWeatherCity(ev) {
        ev.preventDefault();
        cityWrapper.innerHTML = '';
        let city = document.querySelector('.search-input').value;
        if (city) {
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=${units}&lang=${lang}`)
                .then((resp) => {
                    if (!resp.ok) throw new Error(resp.statusText);
                    return resp.json();
                })
                .then((data) => {
                    showWeather(data);
                })
                .catch(console.err);
        } else {
            fetchWeatherRandom();
        }
    };

    //Render city card
    let cityWrapper = document.querySelector('.city-wrapper');

    function showWeather(resp) {
        cityWrapper.innerHTML += `
            <div class="card-city">
                <h4 class="card__name">${resp.name}</h4>
                <span class="card__temperature">${resp.main.temp} °C</span>
                <p class="card__description">${resp.weather[0].description}</p>
                <img class="card__img" src="http://openweathermap.org/img/wn/${resp.weather[0].icon}@4x.png"" alt="">
                <button class="card__btn">More</button>
            </div>`;
        buttonsInit();
    };

    //Initialize card buttons
    function buttonsInit() {
        let buttons = document.querySelectorAll('.card__btn');
        buttons.forEach(btn => {
            btn.onclick = function () {
                modal.style.display = "block";
                let city = btn.parentElement.querySelector('.card__name').textContent;
                document.querySelector('.weather-title').textContent = `${city} 7-day forecast`;
                fetchDetailedWeather(city);
            }
        })
    }

    // Get detailed weather information
    function fetchDetailedWeather(city) {
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=${units}&lang=${lang}`)
            .then((resp) => {
                if (!resp.ok) throw new Error(resp.statusText);
                return resp.json();
            })
            .then((data) => {
                let lat = data.coord.lat;
                let lon = data.coord.lon;
                return fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${key}&units=${units}&lang=${lang}`);
            })
            .then((resp) => {
                if (!resp.ok) throw new Error(resp.statusText);
                return resp.json();
            })
            .then((data) => {
                showDetailedWeather(data);
            })
            .catch(console.err);
    }

    //Render detailed weatherInfo
    let weatherInfo = document.querySelector('.weather-info');

    function showDetailedWeather(resp) {
        weatherInfo.innerHTML = resp.daily
            .map((day, idx) => {
                if (idx <= 6) {
                    let dt = new Date(day.dt * 1000); //timestamp * 1000 
                    return ` 
                        <div class="info-item">
                            <p>${dt.toDateString().slice(0,-4)}</p> 
                            <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}@4x.png"" alt=""> 
                            <p>${day.temp.day} °C</p> 
                            <p>${day.weather[0].description}</p> 
                        </div>
                    `;
                }
            })
            .join(' ');
    }

    // Get weather from user location
    
    let locationBtn = document.querySelector('.location-btn');
    locationBtn.addEventListener('click', getLocation);

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(fetchWeatherLocation);
        } else {
            console.log('no access')
        }
    }

    function fetchWeatherLocation(position) {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        cityWrapper.innerHTML = '';

        fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=9ceb3c3e067e14e0f6b76185c8ce3aee`)
            .then((resp) => {
                if (!resp.ok) throw new Error(resp.statusText);
                return resp.json();
            }).then((data) => {
                return fetch(`https://api.openweathermap.org/data/2.5/weather?q=${data[0].name}&appid=${key}&units=${units}&lang=${lang}`);
            }).then((resp) => {
                if (!resp.ok) throw new Error(resp.statusText);
                return resp.json();
            })
            .then((data) => {
                showWeather(data);
            })
            .catch(console.err);
    }

    //Initialize modal
    let modal = document.querySelector('.modal');
    let closeBtn = document.querySelector('.modal-close');

    closeBtn.onclick = function () {
        modal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}