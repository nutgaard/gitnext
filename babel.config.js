module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' }}],
        '@babel/preset-typescript'
    ],
    "plugins": ["babel-plugin-macros", "@babel/plugin-transform-modules-commonjs"]
}