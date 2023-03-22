import '../scss/main.scss';
import { initFirebase } from './modules/firebase';
import { initOpenWeather } from './modules/openweather';
import { initPreloader } from './modules/preloader';

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initFirebase();
  initOpenWeather();
})