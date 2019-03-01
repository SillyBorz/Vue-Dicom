// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import axios from 'axios'
import qs from 'qs'

import { Slider } from 'iview';
import 'iview/dist/styles/iview.css';
Vue.component('Slider', Slider);

import 'babel-polyfill'
import './assets/css/reset.css'

Vue.prototype.$axios = axios
Vue.prototype.$qs = qs


Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
