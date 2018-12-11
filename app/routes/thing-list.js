import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import ArrayProxy from '@ember/array/proxy';
import { filterBy, sort } from 'ember-awesome-macros/array';
import { raw } from 'ember-awesome-macros';

const ThingArray = ArrayProxy.extend({
  store: null,
  key: null,

  init() {
    this._super(...arguments);
    this.set('allThings', this.store.peekAll('thing'));
  },

  content: filterBy(
    sort('allThings.@each.index', [ 'index' ]),
    raw('key'),
    'key'
  )
});

export default Route.extend({
  store: service(),

  model() {
    return ThingArray.create({ store: this.store, key: 'foo' });
  }
});
