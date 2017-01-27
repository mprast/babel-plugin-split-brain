module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
	    "node": true,
        "jest": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        },
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
	    "no-unused-vars": [
	        "error",
	        {"argsIgnorePattern": "^_"}
	    ],
        "no-console": [
            "off"
        ],
        "react/jsx-uses-vars": 1
    }
};
