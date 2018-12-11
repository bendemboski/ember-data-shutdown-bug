import DS from 'ember-data';

export default DS.Model.extend({
  other: DS.belongsTo('other'),

  key: DS.attr('string'),
  index: DS.attr('number')
});
