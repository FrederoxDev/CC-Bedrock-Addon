import { CommandResult, Vector3, world } from "@minecraft/server";
import { Interpreter } from "../cosmic/src/Interpreter";
import { getNumberLiteral } from "../cosmic/src/Primitives/Number";
import { NativeFunction } from "../cosmic/src/Struct/NativeFunction";
import { NativeFunctionHelper } from "../cosmic/src/Struct/NativeFunctionHelper";
import { StructInstance } from "../cosmic/src/Struct/StructInstance";
import { StructType } from "../cosmic/src/Struct/StructType";
console.log = console.warn

const generateLargeDisplayCommands = (pixelBuffer: number[], origin: Vector3, screenWidth: number, screenHeight: number): string[] => {
    const commands: string[] = [];

    for (var screenXOffset = 0; screenXOffset < screenWidth; screenXOffset++) {
        for (var screenYOffset = 0; screenYOffset < screenHeight; screenYOffset++) {
            const pos = {x: origin.x + screenXOffset, y: origin.y + screenYOffset, z: origin.z};
            const screenBuffer: number[] = []
            world.sendMessage(`${screenXOffset}, ${screenYOffset}`)

            // Create a smaller buffer which is 16x16 for that specific screen
            for (var i = 0; i < 256; i++) {
                const x = (screenXOffset * 16) + i % 16;
                const y = (screenYOffset * 16) + Math.floor(i / 16);
                screenBuffer.push(pixelBuffer[y * (screenWidth * 16) + x]);
            }

            commands.push(...generateDisplayCommands(screenBuffer, pos))
        }
    }

    return commands;
}

const generateDisplayCommands = (pixelBuffer: number[], pos: Vector3): string[] => {
    const commands = [];
    var hasDrawn = new Array(256).fill(false);

    const getIdx = (x: number, y: number) => {
        return y * 16 + x;
    }

    world.sendMessage("Egg")

    for (var x = 0; x < 16; x++) {
        for (var y = 0; y < 16; y++) {
            const idx = getIdx(x, y);
            if (pixelBuffer[idx] == -1) continue; 
            if (hasDrawn[idx]) continue;

            var expandY = 0;
            while (y + expandY + 1 < 16 && pixelBuffer[getIdx(x, expandY + 1)] === pixelBuffer[idx]) expandY++; 
            
            var expandX = 0;
            var tryExpandX = true;

            xLoop: while (x + expandX + 1 < 16 && tryExpandX) {
                var tryX = expandX + 1;
                for (var testY = y; y <= expandY; y++) {
                    if (pixelBuffer[getIdx(tryX, testY)] !== pixelBuffer[idx]) break xLoop;
                }
                expandX++;
            }

            for (var setX = x; setX <= expandX; setX++) {
                for (var setY = y; setY <= expandY; setY++) {
                    hasDrawn[getIdx(setX, setY)] = true;
                }
            }

            world.sendMessage(`${x} + ${expandX}, ${y} + ${expandY} = ${pixelBuffer[idx]}`)
        }
    }

    return commands;
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
        var selfRef = ctx.stack.pop().node as StructInstance;

        const position = selfRef.selfCtx.getProtected<[number, number, number]>("screenPosition");
        const [width, height] = selfRef.selfCtx.getProtected<[number, number]>("screenSize");
        const blockLocation = {x: position[0], y: position[1], z: position[2]}

        if (width * 16 != bufferWidth || height * 16 != bufferHeight) throw interpreter.runtimeErrorCode(
            `Incorrect size for buffer expected (${width * 16} x ${height * 16}), instead got (${bufferWidth} x ${bufferHeight})`,
            start, end
        )

        const overworld = world.getDimension("overworld")

        for (var screenX = 0; screenX < width; screenX++) {
            for (var screenY = 0; screenY < height; screenY++) {
                const screenLoc = {x: blockLocation.x + screenX, y: blockLocation.y + screenY, z: blockLocation.z}
                overworld.getEntitiesAtBlockLocation(screenLoc)
                    .filter(e => e.typeId == "coslang:pixel")
                    .forEach(e => e.kill());
            }
        }

        // Draw the screen buffer
        var promises: Promise<CommandResult>[] = [];

        const res = generateLargeDisplayCommands(pixelBuffer, blockLocation, width, height)
        world.sendMessage(res.toString())

        for (var screenX = 0; screenX < width; screenX++) {
            for (var screenY = 0; screenY < height; screenY++) {
                const screenLoc = {x: blockLocation.x + screenX, y: blockLocation.y + screenY, z: blockLocation.z}

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
        return [null, ctx];
    })
]);