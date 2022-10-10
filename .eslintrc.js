module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        es6: true
    },
    // parser: 'babel-eslint', // 用这个会怎样？
    parserOptions: {
        // ecmaVersion: 2018,
        parser: 'babel-eslint',
        sourceType: 'module'
    },
    extends: ['plugin:vue/essential', 'eslint:recommended', 'plugin:prettier/recommended'],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'prettier/prettier': ['warn', {}, { usePrettierrc: true }],
        'vue/multi-word-component-names': 'off' // 关闭检查：组件名需要两个单词
    }
};
