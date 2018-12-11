'use strict';

module.exports = function() {
  return {
    command: 'yarn test',
    useYarn: true,
    scenarios: [
      {
        name: 'ember-data-3-5',
        npm: {
          devDependencies: {
            'ember-data': '~3.5.0'
          }
        }
      },
      {
        name: 'ember-data-3-4',
        npm: {
          devDependencies: {
            'ember-data': '~3.4.0'
          }
        }
      },
      {
        name: 'ember-data-3-0',
        npm: {
          devDependencies: {
            'ember-data': '~3.0.0'
          }
        }
      },
    ]
  };
};