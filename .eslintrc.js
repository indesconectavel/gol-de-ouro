{
  "env": {
    "es2022": true,
    "node": true,
    "browser": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "warn",
    "no-debugger": "error",
    "no-alert": "error",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    "eqeqeq": "error",
    "curly": "error",
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  },
  "globals": {
    "process": "readonly",
    "Buffer": "readonly",
    "__dirname": "readonly",
    "__filename": "readonly",
    "module": "readonly",
    "require": "readonly",
    "exports": "readonly",
    "global": "readonly"
  }
}
