import { BlockLocation, CommandResult, world } from "@minecraft/server";
import { Interpreter } from "../cosmic/src/Interpreter";
import { getNumberLiteral } from "../cosmic/src/Primitives/Number";
import { NativeFunction } from "../cosmic/src/Struct/NativeFunction";
import { NativeFunctionHelper } from "../cosmic/src/Struct/NativeFunctionHelper";
import { StructInstance } from "../cosmic/src/Struct/StructInstance";
import { StructType } from "../cosmic/src/Struct/StructType";
console.log = console.warn

export const Display = new StructType("Display", [
    // new NativeFunction("Draw", async (interpreter, ctx, self, args) => {
    //     const position = (args[0] as StructRuntime).selfCtx.getProtectedData("screenPosition");
    //     const blockPosition = new BlockLocation(position[0], position[1], position[2])

    //     // Clear the screen
    //     world.getDimension("overworld").getEntitiesAtBlockLocation(blockPosition)
    //     .forEach(entity => {
    //         if (entity.typeId == "coslang:pixel") entity.kill();
    //     })

    //     var bits = (args[0] as StructRuntime).selfCtx.getProtectedData("screenBuffer") as number[];

    //     var promises: Promise<CommandResult>[] = [];

    //     for (var i = 0; i < 256; i++) {
    //         if (bits[i] == -1) continue;

    //         // Only draw 11 pixels at once to prevent going over command limit
    //         if (promises.length > 32) {
    //             await Promise.all(promises)
    //             promises = [];
    //         }
    //         const pixel = world.getDimension("overworld").spawnEntity("coslang:pixel", blockPosition)
    //         const x = i % 16
    //         const y = Math.floor(i / 16);

    //         const promise = [
    //             pixel.runCommandAsync(`event entity @s coslang:set_x_${x}`),
    //             pixel.runCommandAsync(`event entity @s coslang:set_y_${y}`),
    //             pixel.runCommandAsync(`event entity @s coslang:set_color_${bits[i]}`)
    //         ]
    //         // @ts-ignore
    //         promises.push(promise)
    //     }

    //     await Promise.all(promises)
    //     promises = [];

    //     return [null, ctx];
    // }),

    new NativeFunction("Connect", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 3, start, end);
        const instance = new StructInstance(Display);
        const x = getNumberLiteral(helper.expectType(0, "Number"));
        const y = getNumberLiteral(helper.expectType(1, "Number"));
        const z = getNumberLiteral(helper.expectType(2, "Number"));

        instance.selfCtx.setProtected("screenPosition", [x, y, z]);
        instance.selfCtx.setProtected("screenBuffer", new Array(256).fill(-1))
        return [instance, ctx];
    }),

    new NativeFunction("SetPixel", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 3, start, end);
        var selfRef = ctx.stack.pop() as StructInstance;
        var screenBuffer = selfRef.selfCtx.getProtected<number[]>("screenBuffer");

        const x = getNumberLiteral(helper.expectType(0, "Number"));
        const y = getNumberLiteral(helper.expectType(1, "Number"));
        const color = getNumberLiteral(helper.expectType(2, "Number"));

        if (x < 0 || x > 15 || y < 0 || y > 15) {
            throw interpreter.runtimeErrorCode(
                `Pixel (${x}, ${y}) is outside of the pixel display!`,
                start,
                end
            )
        }

        screenBuffer[y * 16 + x] = color;
        selfRef.selfCtx.setProtected("screenBuffer", screenBuffer)
        return [null, ctx]
    }),

    new NativeFunction("Draw", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 0, start, end);
        var selfRef = ctx.stack.pop() as StructInstance;

        const position = selfRef.selfCtx.getProtected<[number, number, number]>("screenPosition");
        const buffer = selfRef.selfCtx.getProtected<number[]>("screenBuffer");
        const blockLocation = new BlockLocation(position[0], position[1], position[2])

        // Clear any pixels drawn to the screen
        world.getDimension("overworld").getEntitiesAtBlockLocation(blockLocation)
            .forEach(entity => {
                if (entity.typeId == "coslang:pixel") entity.kill();
            }
            )

        // Draw the screen buffer
        var promises: Promise<CommandResult>[] = [];

        for (var i = 0; i < 256; i++) {
            if (buffer[i] == -1) continue;

            // Only run 32 commands at once to prevent going over command limit
            if (promises.length > 32) {
                await Promise.all(promises)
                promises = [];
            }
            const pixel = world.getDimension("overworld").spawnEntity("coslang:pixel", blockLocation)
            const x = i % 16
            const y = Math.floor(i / 16);

            promises.push(pixel.runCommandAsync(`event entity @s coslang:set_${x}_${y}`));

            // Dont set the color of white pixels
            if (buffer[i] != 0)
                promises.push(pixel.runCommandAsync(`event entity @s coslang:set_color_${buffer[i]}`))
        }

        await Promise.all(promises)
        promises = [];

        return [null, ctx];
    })
]);