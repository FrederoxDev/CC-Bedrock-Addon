import { BlockLocation, CommandResult, world } from "@minecraft/server";
import { Interpreter } from "../cosmic/src/Interpreter";
import { getNumberLiteral } from "../cosmic/src/Primitives/Number";
import { NativeFunction } from "../cosmic/src/Struct/NativeFunction";
import { NativeFunctionHelper } from "../cosmic/src/Struct/NativeFunctionHelper";
import { StructInstance } from "../cosmic/src/Struct/StructInstance";
import { StructType } from "../cosmic/src/Struct/StructType";
console.log = console.warn

const validatePointOnScreen = (x: number, y: number, interpreter: Interpreter, start: number, end: number) => {
    if (x < 0 || x > 15 || y < 0 || y > 15) {
        throw interpreter.runtimeErrorCode(
            `Pixel (${x}, ${y}) is outside of the pixel display!`,
            start,
            end
        )
    }

    return [x, y];
}

export const Display: StructType = new StructType("Display", [
    new NativeFunction("Connect", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 5, start, end);
        const instance = new StructInstance(Display);
        const x = getNumberLiteral(helper.expectType(0, "Number"));
        const y = getNumberLiteral(helper.expectType(1, "Number"));
        const z = getNumberLiteral(helper.expectType(2, "Number"));

        const width = getNumberLiteral(helper.expectType(3, "Number"));
        const height = getNumberLiteral(helper.expectType(4, "Number"));

        instance.selfCtx.setProtected("screenPosition", [x, y, z]);
        instance.selfCtx.setProtected("screenSize", [width, height]);
        return [instance, ctx];
    }),

    new NativeFunction("DrawBuffer", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 1, start, end);
        const buffer = helper.expectType(0, "PixelBuffer")
        const pixelBuffer = buffer.selfCtx.getProtected<number[]>("pixelBuffer");
        const bufferWidth = buffer.selfCtx.getProtected<number>("bufferWidth");
        const bufferHeight = buffer.selfCtx.getProtected<number>("bufferHeight");
        var selfRef = ctx.stack.pop() as StructInstance;

        const position = selfRef.selfCtx.getProtected<[number, number, number]>("screenPosition");
        const [width, height] = selfRef.selfCtx.getProtected<[number, number]>("screenSize");
        const blockLocation = new BlockLocation(position[0], position[1], position[2])

        if (width * 16 != bufferWidth || height * 16 != bufferHeight) throw interpreter.runtimeErrorCode(
            `Incorrect size for buffer expected (${width * 16} x ${height * 16}), instead got (${bufferWidth} x ${bufferHeight})`,
            start, end
        )

        const overworld = world.getDimension("overworld")

        for (var screenX = 0; screenX < width; screenX++) {
            for (var screenY = 0; screenY < height; screenY++) {
                const screenLoc = blockLocation.offset(screenX, screenY, 0);
                overworld.getEntitiesAtBlockLocation(screenLoc)
                    .filter(e => e.typeId == "coslang:pixel")
                    .forEach(e => e.kill());
            }
        }

        // Draw the screen buffer
        var promises: Promise<CommandResult>[] = [];

        for (var screenX = 0; screenX < width; screenX++) {
            for (var screenY = 0; screenY < height; screenY++) {
                const screenLoc = blockLocation.offset(screenX, screenY, 0);

                for (var i = 0; i < 256; i++) {
                    const localX = i % 16;
                    const localY = Math.floor(i / 16);
                    const x = (screenX * 16) + localX;
                    const y = (screenY * 16) + localY;
                    const idx = y * bufferWidth + x;

                    if (pixelBuffer[idx] == -1) continue;

                    // Only run 32 commands at once to prevent going over command limit
                    if (promises.length > 32) {
                        await Promise.all(promises)
                        promises = [];
                    }

                    const pixel = world.getDimension("overworld").spawnEntity("coslang:pixel", screenLoc)

                    promises.push(pixel.runCommandAsync(`event entity @s coslang:set_${localX}_${localY}`));
                    // Dont set the color of white pixels
                    if (pixelBuffer[idx] != 0)
                        promises.push(pixel.runCommandAsync(`event entity @s coslang:set_color_${pixelBuffer[idx]}`))
                }
            }
        }

        await Promise.all(promises)
        promises = [];

        world.say("Finished Drawing!")
        return [null, ctx];
    })
]);