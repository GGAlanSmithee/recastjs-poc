var rollup = require( 'rollup' );
var babel = require('rollup-plugin-babel');

rollup.rollup({
  entry: 'index.js',
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
}).then(function(bundle) {
  bundle.write({
    globals: {
      three: 'THREE'
    },
    dest: 'out.js',
    sourceMap: 'inline',
    format: 'umd',
    moduleId: 'Test',
    moduleName: 'Test'
  });
});