import Ember from 'ember';
import DS from 'ember-data';

import {
    memberAction,
} from 'ember-api-actions';

export default DS.Model.extend({
    name: DS.attr('string'),
    description: DS.attr('string'),
    inserted_at: DS.attr('utc'),
    updated_at: DS.attr('utc'),
    users: DS.hasMany('user'),
    accessible_databases: DS.hasMany('database'),

    autoSave() {
        Ember.run.debounce(this, () => {
            this.save()
        }, 2000)
    },

    autoSaveObserver: Ember.observer('name', 'description', function () {
        if (this.get('id')) {
            this.autoSave()
        }
    }),

    addUser: memberAction({
        path: 'add_user',
        type: 'post',
        urlType: 'findRecord'
    }),
    removeUser: memberAction({
        path: 'remove_user',
        type: 'post',
        urlType: 'findRecord'
    }),
    removeDatabase: memberAction({
        path: 'remove_database',
        type: 'post',
        urlType: 'findRecord'
    }),
    addDatabase: memberAction({
        path: 'add_database',
        type: 'post',
        urlType: 'findRecord'
    })

});
