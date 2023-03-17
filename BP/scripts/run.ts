import { Parser } from "./cosmic/src/Parser";
import { Tokenize } from "./cosmic/src/Lexer";
import { BeforeChatEvent, Entity, Vector, world } from "@minecraft/server"
import { Context } from "./cosmic/src/Context";
import { NativeFunction } from "./cosmic/src/Struct/NativeFunction";
import { StructInstance } from "./cosmic/src/Struct/StructInstance";
import { Interpreter } from "./cosmic/src/Interpreter";
import { Display } from "./structs/Display";
import { PixelBuffer } from "./structs/PixelBuffer";
import { Thread } from "./structs/Thread";
import { MathStruct } from "./structs/Math";
import { Color } from "./enums/Color";

const logError = (code: string, message: string, startIdx: number, endIdx: number) => {
    const lineStart = code.lastIndexOf("\n", startIdx) + 1;
    const line = code.substring(lineStart, endIdx);
    const lineNum = code.substring(0, startIdx).split("\n").length;
    const colNum = startIdx - lineStart + 1;

    world.sendMessage(`\n${lineNum} | ` + line);
    world.sendMessage(`${" ".repeat(lineNum.toString().length + 3)}` + "§4" + `${" ".repeat(startIdx - lineStart)}${"^".repeat(endIdx - startIdx)}`);
    world.sendMessage(message + `\n§7  at line: ${lineNum}, column: ${colNum}`)
}

export class TurtleInterpreter {
    turtleEntity: Entity;

    constructor(turtleEntity: Entity) {
        this.turtleEntity = turtleEntity;
    }

    runScript = async (input: string) => {
        const tokens = Tokenize(input)
        if (!Array.isArray(tokens)) {
            logError(input, `${tokens.type}: ${tokens.message}`, tokens.start, tokens.end);
            return;
        }

        const parser = new Parser(tokens, input);
        const [ast, parseError]: any = parser.parse();
        // world.sendMessage(`${ast} ${parseError}`)

        if (parseError !== null) {
            world.sendMessage("Parse Error")
            logError(input, parser.errMessage, parser.errStart, parser.errEnd);
            return;
        }

        const globals = new Context()
        globals.setSymbol("Display", Display)
        globals.setSymbol("PixelBuffer", PixelBuffer)
        globals.setSymbol("Thread", Thread)
        globals.setSymbol("Math", MathStruct)
        globals.setSymbol("Color", Color)

        globals.setSymbol("log", new NativeFunction("log", async (interpreter, ctx, start, end, args) => {
            var args = args.map((arg: any) => {
                if (arg instanceof StructInstance) {
                    return arg.selfCtx.getProtected("value")
                } else throw new Error("Cannot log")
            })
            world.sendMessage("> " + args.join(" "))

            return [null, ctx];
        }))

        const interpreter = new Interpreter(input)

        try {
            await interpreter.findTraverseFunc(ast, globals)
            world.sendMessage("Finished executing, with 0 errors!")
        }
        catch (e) {
            if (interpreter.errMessage === "") {
                world.sendMessage(`${e}, ${e.stack}`)
            }
            else logError(input, interpreter.errMessage, interpreter.errStart, interpreter.errEnd)
        }
    }
}