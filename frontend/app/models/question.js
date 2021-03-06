import DS from 'ember-data';
import {
  memberAction,
  collectionAction
} from 'ember-api-actions';
import ResultViewMixin from 'frontend/mixins/result-view-mixin';


export default DS.Model.extend(ResultViewMixin, {
  router: Ember.inject.service(),
  title: DS.attr('string'),
  results_view_settings: DS.attr(),
  human_sql: DS.attr('query-object'),
  query_type: DS.attr('string'),
  sql: DS.attr('string'),
  shareable_link: DS.attr('string'),
  is_shareable_link_public: DS.attr('boolean'),
  has_permission: DS.attr('boolean'),
  columns: DS.attr(),
  cached_results: DS.attr(),
  dashboards: DS.hasMany('dashboards'),
  tags: DS.hasMany('tags'),
  snapshots: DS.hasMany('snapshots'),
  shared_to: DS.attr(),
  variables: DS.hasMany('variables'),
  owner: DS.belongsTo('user'),
  widgets: DS.hasMany('widgets'),
  api_actions: DS.hasMany('api_action', {inverse: "question"}),
  api_action: DS.belongsTo('api_action', {inverse: 'top_level_question'}),
  variables_from_this_question: DS.hasMany('variables', {
    inverse: 'question_filter'
  }),

  apiActionsChanged: Ember.computed('api_actions.isFulFilled', 'api_actions.@each.column', function () {
    return new Date();
  }),

  inserted_at: DS.attr('utc'),
  updated_at: DS.attr('utc'),

  shareable_url: Ember.computed('shareable_link', function () {
    return window.location.origin + this.get('router').urlFor('questions.show', {
      question_id: this.get('id'),
      queryParams: {
        share_id: this.get('shareable_link')
      }
    });
  }),

  toJSON: function () {
    return this._super({
      includeId: true
    });
  },


  cachedResults: Ember.on('didLoad', Ember.observer('api_action.isLoaded', 'updated_at', 'resultsCanBeLoaded', 'cached_results', function () {
    if (this.get('resultsCanBeLoaded') && !this.get('loading')) {
      this.set('loading', true);
      this.set('results', null);
      let variables = this.get('query_variables');
      variables = variables && variables.map((item) => {
        return {
          name: item.get('name'),
          value: item.get('value') || item.get('default'),
          var_type: item.get('var_type'),
          default_options: item.get('default_options')
        };
      }).filter((item) => {
        return item.hasOwnProperty('name') && item['name'];
      });
      if (this.get('query_type') == 'api_client' && this.get('api_action.isLoaded')) {
        this.resultsCall({
          variables: variables,
          additionalFilters: this.get('human_sql.additionalFilters')
        }).then((response) => {
          let results = this.parseApiActionResult(response.data, this.get('api_action'))
          this.set('results', results);
          this.set('cached_results', results);

          this.set('loading', false);
          this.set('resultsCanBeLoaded', false);
          this.set('errorMessage', null);
          // }).then((error)=>{
          //     this.set('resultError', error.error)
          //     this.set("loading", false)
          // })
        }).catch((error) => {
          this.set('errorMessage', 'Query could not be completed. Please check filters.');
          this.set('loading', false);
          this.set('results', null);
          this.set('cached_results', null);
          this.set('resultsCanBeLoaded', false);
        });

      } else if (this.get('query_type') != 'api_client') {

        this.resultsCall({
          variables: variables,
          additionalFilters: this.get('human_sql.additionalFilters')
        }).then((response) => {
          this.set('results', response.data);
          this.set('cached_results', response.data);
          this.set('loading', false);
          this.set('resultsCanBeLoaded', false);
          this.set('errorMessage', null);
          // }).then((error)=>{
          //     this.set('resultError', error.error)
          //     this.set("loading", false)
          // })
        }).catch((error) => {
          this.set('errorMessage', 'Query could not be completed. Please check filters.');
          this.set('loading', false);
          this.set('results', null);
          this.set('cached_results', null);
          this.set('resultsCanBeLoaded', false);
        });
      } else {
        this.set('loading', false);
      }
    } else if (!this.get('errorMessage') && !this.get('loading')) {
      this.set('results', this.get('cached_results'));
    }
  })),

  mergedVariables: Ember.computed('dashboardVariables.@each', 'query_variables', function () {
    this.get('dashboardVariables') && this.get('dashboardVariables').forEach((item) => {
      let query_var = this.get('query_variables').findBy('name', item.get('name'));
      query_var && this.get('query_variables').removeObject(query_var);
      query_var && this.get('query_variables').pushObject(item);
    });
    return this.get('query_variables');
  }),
  dashboardVariables: [],

  updatedAgoColor: Ember.computed('updated_at', 'updatedAgoColorChangeTime', function () {
    let updated_at = this.get('updated_at');
    if (updated_at) {
      if (moment(updated_at).add(30, 'minutes') > moment()) {
        return 'green';
      } else {
        return 'red';
      }
    }
  }),
  refreshInterval: 60000,
  startTimer: Ember.on('didLoad', function () {
    !this.isDestroyed && this.set('timer', this.schedule(this.get('onPoll')));
  }),
  schedule: function (f) {
    return Ember.run.later(this, function () {
      f.apply(this);
      !this.isDestroyed && this.set('timer', this.schedule(f));
    }, this.get('refreshInterval.value'));
  },

  onPoll: function () {
    !this.isDestroyed && this.set('updatedAgoColorChangeTime', new Date());
  },
  query_variables: Ember.computed.alias('variables'),
  showCardHeader: Ember.computed('results_view_settings', 'results_view_settings.resultsViewType', function () {
    return this.get('results_view_settings.resultsViewType') != 'Number';
  }),
  icon: Ember.computed('results_view_settings', 'results_view_settings.resultsViewType', function () {
    let resultsViewType = this.get('results_view_settings.resultsViewType');
    resultsViewType = resultsViewType && resultsViewType.toLowerCase();
    return this.get('resultViewIcons')[resultsViewType] || 'fe fe-list';
  }),

  resultsCall: memberAction({
    path: 'results',
    type: 'post',
    urlType: 'findRecord'
  }),
  resultsCanBeLoaded: false

});
