var rollup = require('rollup');
var babel = require('rollup-plugin-babel');

rollup.rollup({
  entry: 'src/index.js',
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
    dest: 'dist/out.js',
    sourceMap: 'inline',
    format: 'umd',
    moduleId: 'Test',
    moduleName: 'Test'
  });
});