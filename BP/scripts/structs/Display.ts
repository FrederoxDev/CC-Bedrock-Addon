import { createStructInstance } from "../cosmic/src/Interpreter/Interpreter";
import { NativeFunction } from "../cosmic/src/Interpreter/Primitives/NativeFunction";
import { Struct } from "../cosmic/src/Interpreter/Primitives/Struct";
import { StructRuntime } from "../cosmic/src/Interpreter/Primitives/StructRuntime";
import { getLiteralValue } from "../cosmic/src/Interpreter/Structs/StructCommon";
import { BlockLocation, CommandResult, world } from "@minecraft/server"

console.log = console.warn

export const Display = new Struct("Display", [], [
    new NativeFunction("Connect", async (interpreter, ctx, self, args) => {
        const display = createStructInstance(Display);
        const x = getLiteralValue<number>(args[0] as StructRuntime).value;
        const y = getLiteralValue<number>(args[1] as StructRuntime).value;
        const z = getLiteralValue<number>(args[2] as StructRuntime).value;
        display.selfCtx.setProtectedData("screenPosition", [x, y, z]);
        display.selfCtx.setProtectedData("screenBuffer", new Array(256).fill(-1))

        return [display, ctx]
    }),

    new NativeFunction("SetPixel", async (interpreter, ctx, self, args) => {
        const bits = (args[0] as StructRuntime).selfCtx.getProtectedData("screenBuffer") as number[]
        const x = getLiteralValue<number>(args[1] as StructRuntime).value;
        const y = getLiteralValue<number>(args[2] as StructRuntime).value;
        const newVal = getLiteralValue<number>(args[3] as StructRuntime).value;
        console.log(x, y, newVal)

        if (x > 16 || y > 16 || x < 0 || y < 0) interpreter.runtimeError(`Cannot draw to position ${x}, ${y}. Out of screen range.`)
        bits[y * 16 + x] = newVal;
        (args[0] as StructRuntime).selfCtx.setProtectedData("screenBuffer", bits);
        return [args[0], ctx];
    }),

    new NativeFunction("Draw", async (interpreter, ctx, self, args) => {
        const position = (args[0] as StructRuntime).selfCtx.getProtectedData("screenPosition");
        const blockPosition = new BlockLocation(position[0], position[1], position[2])

        // Clear the screen
        world.getDimension("overworld").getEntitiesAtBlockLocation(blockPosition)
        .forEach(entity => {
            if (entity.typeId == "coslang:pixel") entity.kill();
        })

        var bits = (args[0] as StructRuntime).selfCtx.getProtectedData("screenBuffer") as number[];

        var promises: Promise<CommandResult>[] = [];

        for (var i = 0; i < 256; i++) {
            if (bits[i] == -1) continue;

            // Only draw 11 pixels at once to prevent going over command limit
            if (promises.length > 32) {
                await Promise.all(promises)
                promises = [];
            }
            const pixel = world.getDimension("overworld").spawnEntity("coslang:pixel", blockPosition)
            const x = i % 16
            const y = Math.floor(i / 16);

            const promise = [
                pixel.runCommandAsync(`event entity @s coslang:set_x_${x}`),
                pixel.runCommandAsync(`event entity @s coslang:set_y_${y}`),
                pixel.runCommandAsync(`event entity @s coslang:set_color_${bits[i]}`)
            ]
            // @ts-ignore
            promises.push(promise)
        }

        await Promise.all(promises)
        promises = [];

        return [null, ctx];
    }),
]);