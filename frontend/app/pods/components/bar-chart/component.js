import Ember from 'ember';
import UtilsFunctions from "frontend/mixins/utils-functions";

var get = Ember.get,
    arrayComputed = Ember.arrayComputed;
export default Ember.Component.extend( UtilsFunctions, {

    didInsertElement(){
        this.getData()
    },
    chartData(item){
        return item.get('contents').map((el, j)=> {
            return el.y
        })
    },
    calculateXScale(item){
        return;
    },
});
