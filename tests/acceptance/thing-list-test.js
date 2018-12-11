import { module, test } from 'qunit';
import { visit, currentURL, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | thing list', function(hooks) {
  setupApplicationTest(hooks);

  test('unload out of order', async function(assert) {
    let store = this.owner.lookup('service:store');

    let thing1 = store.createRecord('thing', { key: 'foo', index: 1 });
    let thing2 = store.createRecord('thing', { key: 'foo', index: 2 });

    await visit('/thing-list');

    store.unloadRecord(thing2);
    store.unloadRecord(thing1);
    await settled();

    assert.equal(currentURL(), '/thing-list');
  });

  test('destroy owner', async function(assert) {
    let store = this.owner.lookup('service:store');

    store.pushPayload({
      data: [{
        id: 1,
        type: 'other',
        attributes: {},
        relationships: {}
      }]
    });

    let other = await store.peekRecord('other', 1);
    store.createRecord('thing', { key: 'foo', index: 1 });
    store.createRecord('thing', { key: 'foo', index: 2, other });

    await visit('/thing-list');

    assert.equal(currentURL(), '/thing-list');
  });
});
