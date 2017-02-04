"use strict";

<SplitBrain.Chunk_Intermediate>{require.ensure(["../components/TestElementPath"], function () {
        var TestElementOne = require("../components/TestElementPath").default;

        return functionThatReturnsTestElementOne();
    })}</SplitBrain.Chunk_Intermediate>;
