import Ember from 'ember';
import FilterOperatorMixin from 'frontend/mixins/filter-operator-mixin';

export default Ember.Component.extend(FilterOperatorMixin, {
  column: Ember.computed('results', 'index', function () {
    let index = this.get('index');
    let columns = this.get('results.columns');
    return columns[index];
  }),

  noGroupBysInAdditionalFilters: Ember.computed('additionalFilters.groupBys.@each.column.name', 'column', function () {
    let groupBys = this.get('additionalFilters.groupBys');
    return groupBys && (groupBys.length == 0);
  }),

  columnObj: Ember.computed('column', function () {

    return {
      name: this.get('column'),
      human_name: this.get('column'),
      data_type: this.figureOutDataType()
    };
  }),

  figureOutDataType() {
    let rows = this.get('results.rows');
    let columns = this.get('results.columns');
    let index = columns.indexOf(this.get('column'));

    let dataType = 'Not Relevent';
    rows.every((row) => {
      if (moment(row[index], moment.ISO_8601, true).isValid()) {
        dataType = 'datetime';
        return false;
      }
      return true;
    });
    return dataType;
  },


  filterObj: Ember.computed('additionalFilters.filters.@each.column.name', 'results', 'column', 'value', function () {
    let filters = this.get('additionalFilters.filters');
    let obj = null;
    filters && filters.every((filter) => {

      if (filter.get('column.name') == this.get('column') && filter.get('value') == this.get('value')) {
        obj = filter;
        return false;
      }
      return true;
    });
    return obj;
  }),
  availableOperators: Ember.computed('value', function () {
    return this.findAvailableOperators(this.get('value'));
  }),


  actions: {
    addFilter(operator) {
      if (this.get('filterObj')) {
        this.set('filterObj.operator', operator);
      } else {
        this.get('additionalFilters.filters').pushObject(
          {
            column: this.get('columnObj'),
            operator: operator,
            value: this.get('value'),
            valueDateObj: { date: false }
          }
        );
      }
      this.sendAction('apply');
    }
  }
});
