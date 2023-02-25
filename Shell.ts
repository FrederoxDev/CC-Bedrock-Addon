import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs"
import { Context } from "./BP/scripts/coslang/src/Interpreter/Context";
import { Interpreter } from "./BP/scripts/coslang/src/Interpreter/Interpreter";
import { NativeFunction } from "./BP/scripts/coslang/src/Interpreter/Primitives/NativeFunction";
import { Struct } from "./BP/scripts/coslang/src/Interpreter/Primitives/Struct";
import { StructRuntime } from "./BP/scripts/coslang/src/Interpreter/Primitives/StructRuntime";
import { BooleanStruct } from "./BP/scripts/coslang/src/Interpreter/Structs/BooleanStruct";
import { NumberStruct } from "./BP/scripts/coslang/src/Interpreter/Structs/NumberStruct";
import { StringStruct } from "./BP/scripts/coslang/src/Interpreter/Structs/StringStruct";
import { Tokenize } from "./BP/scripts/coslang/src/Lexer";
import { Parser } from "./BP/scripts/coslang/src/Parser";

if (!existsSync("./err")) mkdirSync("./err");
const input = readFileSync("./input.cos", { encoding: 'utf-8' });

/* Lexing */
const tokens = Tokenize(input);
writeFileSync('./err/tokens.json', JSON.stringify(tokens, null, 2), { flag: "w" });

// /* AST Parsing */
const [ast, parseError] = new Parser(tokens, input).parse();
if (parseError) {
    console.error(parseError);
    process.exit(1);
}
writeFileSync('./err/ast.json', JSON.stringify(ast, null, 2), { flag: "w" });

/* Interpreting */
console.log("Output:")
const globals = new Context(undefined)
globals.setVariable("Number", NumberStruct)
globals.setVariable("Boolean", BooleanStruct)
globals.setVariable("String", StringStruct)

globals.setVariable("log", new NativeFunction("log", async (interpreter, ctx, args) => {
    var out: string[] = [];

    for (var i = 0; i < args.length; i++) {
        const arg = await args[i];

        if (arg instanceof StructRuntime) {
            if (!arg.hasImplementedFunction("Inspect")) {
                out.push(arg?.inspect?.());
                continue;
            }
            const inspect = arg.getImplementedFunction("Inspect")

            if (inspect instanceof NativeFunction) {
                var [result, ctx] = await inspect.onCall(interpreter, ctx, arg);
                out.push(result.selfCtx.getVariable("value").value)
            }
        }

        else if (arg instanceof Struct) {
            out.push(arg.inspect())
        }

        else if (arg instanceof NativeFunction) {
            out.push(arg.inspect());
        }

        else {
            console.log("Log no inspect", await arg)
        }
    }

    console.log("Starting waiting")
    await new Promise(resolve => {
        setTimeout(resolve, 3000);
    });
    console.log("Finished Waiting")

    console.log("\x1b[90m>\x1b[37m", ...out)
    return [null, ctx];
}))

new Interpreter(ast, input, globals).execute().then(result => {
    if (result instanceof Error) {
        console.error(result);
        process.exit(1);
    }
    
    console.log("\nFinished running with 0 errors!\n")
})