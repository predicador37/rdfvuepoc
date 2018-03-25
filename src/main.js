import Vue from 'vue'
import BootstrapVue from "bootstrap-vue"
import App from './App.vue'
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-vue/dist/bootstrap-vue.css"
import rdfFetch from 'rdf-fetch-lite'
import Parser from 'rdf-parser-n3'
import DataFactory from 'rdf-ext'
import TagsInput from '@voerro/vue-tagsinput';
import vSelect from 'vue-select'
import Readable from 'readable-stream'
import Serializer from 'rdf-serializer-jsonld-ext'


Vue.use(BootstrapVue);
Vue.component('tags-input', TagsInput);
Vue.component('v-select', vSelect);
Vue.http.headers.common['Access-Control-Allow-Origin'] = '*';
Object.defineProperty(Vue.prototype, '$rdfFetch' , { value: rdfFetch });
Object.defineProperty(Vue.prototype, '$N3Parser' , { value: Parser });
Object.defineProperty(Vue.prototype, '$rdf' , { value: DataFactory });
Object.defineProperty(Vue.prototype, '$Readable' , { value: Readable });
Object.defineProperty(Vue.prototype, '$JsonLdSerializer' , { value: Serializer });


new Vue({
  el: '#app',
  render: h => h(App)
})
