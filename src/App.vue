<template>
  <div id="app">
    <h1>{{ msg }}</h1>
    <b-container class="bv-example-row">
      <b-row class="component-wrapper">
        <b-col>  <tags-input element-id="tags"
                             v-model="selectedTags"
                             :existing-tags="existingTags"
                             :old-tags="selectedTags"
                             :typeahead="true"></tags-input></b-col>

      </b-row>
      <b-row class="component-wrapper">
        <b-col> <b-form @submit="onSubmit" @reset="onReset" v-if="show">
          <b-form-group id="subjectGroup"
                        label="Subject:"
                        label-for="subject">
          <v-select id='subject' v-model="selectedSubject" :options="selectedTags"></v-select>
          </b-form-group>

          <b-form-group id="predicateGroup"
                        label="Predicate:"
                        label-for="predicate">
            <b-form-select id="predicate"
                           :options="rdfProperties"
                           required
                           v-model="selectedPredicate">
            </b-form-select>
          </b-form-group>
          <b-form-group id="objectGroup"
                        label="Object:"
                        label-for="object">
            <b-form-select id="object"
                           :options="selectedTags"
                           required
                           v-model="selectedObject">
            </b-form-select>
          </b-form-group>

        </b-form></b-col>
        <b-col><div class="panel panel-default">
          <div class="panel-heading">
            <h4>Your triple</h4>
          </div>
          <div class="panel-body">
            <p>Subject: {{qualifiedSubject}}</p>
            <p>Predicate: {{selectedPredicate}}</p>
            <p>Object: {{qualifiedObject}}</p>

            <b-button type="submit" variant="primary" @click="exportJsonLD">Export</b-button>

          </div>
        </div></b-col>

      </b-row>
    </b-container>


  </div>
</template>

<script>
export default {
  name: 'app',
  data () {
    return {
      msg: 'RDF editor proof of concept',
      rdfProperties: this.getPredicates(),
      selectedPredicate: null,
      selectedObject: null,
      show: true,
      existingTags: {analisis: 'analisis', pruebas:'pruebas', fase:'fase', metodologia:'metodologia', analista:'analista', usuario:'usuario', producto:'producto', artefacto:'artefacto', especificacion:'especificacion funcional'},
      selectedTags: ['analisis', 'pruebas', 'fase', 'metodologia', 'analista', 'usuario', 'producto', 'artefacto', 'especificacion funcional'] ,
      selectedSubject: null
    }
  },
  computed: {
      qualifiedSubject: function () {
          // `this` points to the vm instance
          var prefix = 'http://www.uned.es/semantic/';
          if (this.selectedSubject != null) {
              return prefix + this.selectedSubject.charAt(0).toUpperCase() + this.selectedSubject.slice(1);
          }
          else {
              return null
          }
      },

      qualifiedObject: function () {
          // `this` points to the vm instance
          var prefix = 'http://www.uned.es/semantic/';
          if (this.selectedObject != null) {
              return prefix + this.selectedObject.charAt(0).toUpperCase() + this.selectedObject.slice(1);
          }
          else {
              return null
          }
      }

  },
  methods: {
        getPredicates: function () {
            var rdfProperties = [];
            let formats = {
                parsers: new this.$rdf.Parsers({
                    'text/turtle': this.$N3Parser
                })
            }


// use the Stream API to read the opening date of the Eiffel Tower
            this.$rdfFetch('https://www.w3.org/2000/01/rdf-schema', {formats: formats}).then((res) => {
                return res.quadStream()
            }).then((stream) => {

                stream.on('data', (quad) => {
                    if ((quad.object.equals(this.$rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#Property'))) && (quad.predicate.equals(this.$rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')))) {
                        //console.log('Subject ' + quad.subject.value + ' Predicate ' + quad.predicate.value + ' Object ' + quad.object.value)
                        if (! rdfProperties.includes(quad.subject.value)) {
                            var shortName = quad.subject.value.split('http://www.w3.org/2000/01/rdf-schema#');
                            rdfProperties.push({text:shortName[1], value: quad.subject.value});
                        }
                    }
                })

                //return this.$rdf.waitFor(stream)
            }).catch((err) => {
                console.error(err.stack || err.message)
            })
        return rdfProperties;
        },
      onSubmit (evt) {
          evt.preventDefault();
          alert(JSON.stringify(this.form));
          console.log(this.selected)
      },
      onReset (evt) {
          evt.preventDefault();
          /* Reset our form values */

          this.selected = null;

          /* Trick to reset/clear native browser form validation state */
          this.show = false;
          this.$nextTick(() => { this.show = true });
      },
      exportJsonLD: function () {
          // create a prefix map and fill it
          const prefixMap = this.$rdf.prefixMap({
              ex: this.$rdf.namedNode('http://www.uned.es/semantic/')
          })

          const quad = this.$rdf.quad(
              prefixMap.resolve('ex:' + this.selectedSubject.charAt(0).toUpperCase() + this.selectedSubject.slice(1)),
              this.$rdf.namedNode(this.selectedPredicate),
              prefixMap.resolve('ex:' + this.selectedObject.charAt(0).toUpperCase() + this.selectedObject.slice(1))
              )


          // create a quad stream to feed the serializer
          const quadStream = new this.$Readable({
              objectMode: true,
              read: () => {}
          })


          // create a JSON-LD serializer instance which returns strings and compacts the JSON-LD
          const serializer = new this.$JsonLdSerializer({outputFormat: 'string', compact: true})

          // forward the quads to the serializer
          const jsonStream = serializer.import(quadStream)




          // pipe the serializer output to stdout
         // jsonStream.pipe(process.stdout)
          //console.log(jsonStream)
          // forward the prefix map...
          prefixMap.export(quadStream)

          // ...and the quad
          quadStream.push(quad)
          quadStream.push(null)

          let result

          jsonStream.on('data', (data) => {
              result = data
          })

          return this.$rdf.waitFor(jsonStream).then(() => {

              var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(result);
              var downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href",     dataStr);
              downloadAnchorNode.setAttribute("download", "dataset.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
              console.log(dataStr)

          })



        }


  }


}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {

  margin: 0 10px;
}

a {
  color: #42b983;
}


/**
* Original styles
*/
.tags-input-default-class {
  padding: .5rem .25rem;

  background: #fff;

  border: 1px solid transparent;
  border-radius: .25rem;
  border-color: #dbdbdb;
}

.tags-input-remove {
  cursor: pointer;
  position: relative;
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  overflow: hidden;
}

.tags-input-remove:before, .tags-input-remove:after {
  content: '';
  position: absolute;
  width: 100%;
  top: 50%;
  left: 0;
  background: #5dc282;

  height: 2px;
  margin-top: -1px;
}

.tags-input-remove:before {
  transform: rotate(45deg);
}
.tags-input-remove:after {
  transform: rotate(-45deg);
}

.component-wrapper {
  margin-bottom:20px;
}
</style>
