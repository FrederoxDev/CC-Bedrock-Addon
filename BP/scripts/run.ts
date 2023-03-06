import { Parser } from "./cosmic/src/Parser";
import { Tokenize } from "./cosmic/src/Lexer";
import { BeforeChatEvent, Entity, Vector, world } from "@minecraft/server"
import { Turtle, drawTurtle } from "./structs/Turtle"
import { Context } from "./cosmic/src/Context";
import { NativeFunction } from "./cosmic/src/Struct/NativeFunction";
import { StructInstance } from "./cosmic/src/Struct/StructInstance";
import { Interpreter } from "./cosmic/src/Interpreter";
import { Display } from "./structs/Display";

export class TurtleInterpreter {
    turtleEntity: Entity;

    constructor(turtleEntity: Entity) {
        this.turtleEntity = turtleEntity;
    }

    runScript = async (input: string) => {
        // const floorX = Math.floor(this.turtleEntity.location.x)
        // const floorY = Math.floor(this.turtleEntity.location.y)
        // const floorZ = Math.floor(this.turtleEntity.location.z)
        // world.say(turtleCtx.getProtectedData("position").toString())
        // globals.setProtectedData("position", [floorX, floorY, floorZ]);
        // globals.setProtectedData("rotation", 0);
        // globals.setProtectedData("entity", this.turtleEntity);

        // Execute the file
        const tokens = Tokenize(input)
        const [ast, parseError] = new Parser(tokens, input).parse();

        if (parseError) {
            world.say(parseError.message)
            return parseError;
        }

        const globals = new Context()
        globals.setSymbol("Display", Display)

        globals.setSymbol("log", new NativeFunction("log", async (interpreter, ctx, start, end, args) => {
            var args = args.map((arg: any) => {
                if (arg instanceof StructInstance) {
                    return arg.selfCtx.getProtected("value")
                } else throw new Error("Cannot log")
            })
            world.say("> " + args.join(" "))

            return [null, ctx];
        }))


        new Interpreter(input).findTraverseFunc(ast, globals)
    }
}