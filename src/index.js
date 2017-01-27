export default function ({ types: t }) {
    const visitor = {
        JSXElement(path){
            const name = path.node.openingElement.name;
            if (t.isJSXMemberExpression(name)){
                const fullyQualified = `${name.object.name}.${name.property.name}`;

                if (fullyQualified == "SplitBrain.Chunk"){

                    const children = path.node.children;
                    const isNotJSXWhitespace = function(obj) {
                        return obj.type != "JSXText" || obj.value.trim() != "";
                    };
                    const childrenNoWhitespace = children.filter(isNotJSXWhitespace);

                    if (childrenNoWhitespace.length != 1){
                        const err = "A Chunk element should have exactly one child.";
                        throw path.buildCodeFrameError(err); 
                    }

                    // SplitBrain.Chunk_Intermediate needs to be imported 
                    // from split-brain-core for this to work
                    path.replaceWith(buildSBIComponent(childrenNoWhitespace[0], t));                                  }
            }
            // pass-through
            // don't think we need this...
            // return path.node;
        }
    };

    // the point of this JSX plugin is to replace SplitBrain.Chunk with 
    // SplitBrain.Chunk_Intermediate. This builds SplitBrain.Chunk_Intermediate
    // given SplitBrain.Chunk's children
    function buildSBIComponent(children, t){
        const namePartOne = t.jSXIdentifier("SplitBrain");
        const namePartTwo = t.jSXIdentifier("Chunk_Intermediate");
        const memberExp = t.jSXMemberExpression(namePartOne, namePartTwo);
        const opener = t.jSXOpeningElement(memberExp, []);
        const closer = t.jSXClosingElement(memberExp);
        
        // we need this because we want to pass a lambda (and not React 
        // elements) to this new element via props.children
        const arrowExp = t.arrowFunctionExpression([], children);
        const expContainer = t.jSXExpressionContainer(arrowExp);

        return t.jSXElement(
            opener,
            closer,
            [expContainer],
            false
        );
    }

    return {
        inherits: require("babel-plugin-syntax-jsx"),
        visitor: visitor
    };
}

