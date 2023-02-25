import { Parser } from "./coslang/src/Parser";
import { Tokenize } from "./coslang/src/Lexer";
import { Interpreter } from "./coslang/src/Interpreter/Interpreter";
import { BeforeChatEvent, world } from "@minecraft/server"
import { NativeFunction } from "./coslang/src/Interpreter/Primitives/NativeFunction";
import { StringStruct } from "./coslang/src/Interpreter/Structs/StringStruct";
import { BooleanStruct } from "./coslang/src/Interpreter/Structs/BooleanStruct";
import { NumberStruct } from "./coslang/src/Interpreter/Structs/NumberStruct";
import { Context } from "./coslang/src/Interpreter/Context";
import { StructRuntime } from "./coslang/src/Interpreter/Primitives/StructRuntime";
import { Struct } from "./coslang/src/Interpreter/Primitives/Struct";
import { Turtle, drawTurtle } from "./structs/Turtle"

const globals = new Context(undefined)
globals.setVariable("Number", NumberStruct)
globals.setVariable("Boolean", BooleanStruct)
globals.setVariable("String", StringStruct)

// Coslang specific structs
globals.setVariable("Turtle", Turtle)

// Protected Data
globals.setProtectedData("position", [0, -60, 0]);
globals.setProtectedData("rotation", 0);

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
            console.log(arg)
        }
    }

    var text = "";
    out.forEach(line => text += "§7>§r " + line + " ")

    world.say(text)
    return [null, ctx];
}))

export const runScript = async (e: BeforeChatEvent, input: string) => {
    const tokens = Tokenize(input)

    const [ast, parseError] = new Parser(tokens, input).parse();
    if (parseError) {
        e.message = parseError.message;
        throw parseError;
    }

    const result = await (new Interpreter(ast, input, globals).execute()) as any;

    if (result instanceof Error) {
        e.message = result.message;
        throw result
    }

    console.warn("Finished running with 0 errors!")
}