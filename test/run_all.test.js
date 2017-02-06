var fs = require("fs");
var path = require("path");
var babel = require("babel-core");

// based on https://github.com/shuhei/babel-plugin-auto-assign/blob/master/test/index.js

function test(fixtureName, extra_options) {
    it(fixtureName, function () {
        var fixturePath = path.resolve(__dirname, "fixtures", fixtureName, "fixture.js");
        var expectedPath = path.resolve(__dirname, "fixtures", fixtureName, "expected.js");
        /*global package_root*/
        /*package_root gets set in the "jest/globals" section of package.json*/
        var actual = babel.transformFileSync(fixturePath, {
            plugins: [[package_root, extra_options]]
        }).code;
        var expected = fs.readFileSync(expectedPath, { encoding: "utf8" });
        expect(actual + "\n").toEqual(expected);
    });
}

[
    "injects_require_ensure",
    "handles_nested_children",
    "handles_expression_containers"
].map((fixtureName) => test(fixtureName, {}));

[
    "strips_require_when_disabled"
].map((fixtureName) => test(fixtureName, {disabled: true}));
