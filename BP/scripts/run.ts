import { Parser } from "./coslang/src/Parser";
import { Tokenize } from "./coslang/src/Lexer";
import { Interpreter } from "./coslang/src/Interpreter/Interpreter";
import { BeforeChatEvent, Entity, Vector, world } from "@minecraft/server"
import { NativeFunction } from "./coslang/src/Interpreter/Primitives/NativeFunction";
import { StringStruct } from "./coslang/src/Interpreter/Structs/StringStruct";
import { BooleanStruct } from "./coslang/src/Interpreter/Structs/BooleanStruct";
import { NumberStruct } from "./coslang/src/Interpreter/Structs/NumberStruct";
import { Context } from "./coslang/src/Interpreter/Context";
import { StructRuntime } from "./coslang/src/Interpreter/Primitives/StructRuntime";
import { Struct } from "./coslang/src/Interpreter/Primitives/Struct";
import { Turtle, drawTurtle } from "./structs/Turtle"

export class TurtleInterpreter {
    turtleEntity: Entity;

    constructor(turtleEntity: Entity) {
        this.turtleEntity = turtleEntity;
    }

    runScript = async (input: string) => {
        const globals = new Context(undefined)
        globals.setVariable("Number", NumberStruct)
        globals.setVariable("Boolean", BooleanStruct)
        globals.setVariable("String", StringStruct)
        globals.setVariable("Turtle", Turtle)

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
        const floorX = Math.floor(this.turtleEntity.location.x)
        const floorY = Math.floor(this.turtleEntity.location.y)
        const floorZ = Math.floor(this.turtleEntity.location.z)
        // world.say(turtleCtx.getProtectedData("position").toString())
        globals.setProtectedData("position", [floorX, floorY, floorZ]);
        globals.setProtectedData("rotation", 0);
        globals.setProtectedData("entity", this.turtleEntity);

        // Execute the file
        const tokens = Tokenize(input)
        const [ast, parseError] = new Parser(tokens, input).parse();

        if (parseError) {
            world.say(parseError.message)
            return parseError;
        }

        const result = await (new Interpreter(ast, input, globals).execute()) as any;
        if (result instanceof Error) {
            world.say(result.message);
            return result
        }
    }
}