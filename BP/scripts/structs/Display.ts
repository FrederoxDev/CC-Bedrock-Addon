import { Entity, Vector3, world } from "@minecraft/server";
import { getNumberLiteral } from "../cosmic/src/Primitives/Number";
import { NativeFunction } from "../cosmic/src/Struct/NativeFunction";
import { NativeFunctionHelper } from "../cosmic/src/Struct/NativeFunctionHelper";
import { StructInstance } from "../cosmic/src/Struct/StructInstance";
import { StructType } from "../cosmic/src/Struct/StructType";
console.log = console.warn

interface PixelData {
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    screenX: number,
    screenY: number,
}

const generateLargeDisplayCommands = (pixelBuffer: number[], origin: Vector3, screenWidth: number, screenHeight: number): PixelData[] => {
    const commands: PixelData[] = [];

    for (var screenXOffset = 0; screenXOffset < screenWidth; screenXOffset++) {
        for (var screenYOffset = 0; screenYOffset < screenHeight; screenYOffset++) {
            const screenBuffer: number[] = []

            // Create a smaller buffer which is 16x16 for that specific screen
            for (var i = 0; i < 256; i++) {
                const x = (screenXOffset * 16) + i % 16;
                const y = (screenYOffset * 16) + Math.floor(i / 16);
                screenBuffer.push(pixelBuffer[y * (screenWidth * 16) + x]);
            }

            commands.push(...generateDisplayCommands(screenBuffer, screenXOffset, screenYOffset))
        }
    }

    return commands;
}

const generateDisplayCommands = (pixelBuffer: number[], screenX: number, screenY: number): PixelData[] => {
    const commands: PixelData[] = [];
    var hasDrawn = new Array(256).fill(false);

    const getIdx = (x: number, y: number) => {
        return y * 16 + x;
    }

    for (var x = 0; x < 16; x++) {
        for (var y = 0; y < 16; y++) {
            const idx = getIdx(x, y);
            if (pixelBuffer[idx] == -1) continue;
            if (hasDrawn[idx]) continue;

            var expandY = 0;
            while (y + expandY + 1 < 16 && pixelBuffer[getIdx(x, expandY + 1)] === pixelBuffer[idx]) expandY++;

            var expandX = 0;

            for (var setX = x; setX <= x + expandX; setX++) {
                for (var setY = y; setY <= y + expandY; setY++) {
                    hasDrawn[getIdx(setX, setY)] = true;
                }
            }

            commands.push({
                x,
                y,
                width: 1 + expandX,
                height: 1 + expandY,
                color: pixelBuffer[idx],
                screenX,
                screenY
            });
        }
    }

    return commands;
}

export const Display: StructType = new StructType("Display", [], [
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
        const blockLocation = { x: position[0], y: position[1], z: position[2] }

        if (width * 16 != bufferWidth || height * 16 != bufferHeight) throw interpreter.runtimeErrorCode(
            `Incorrect size for buffer expected (${width * 16} x ${height * 16}), instead got (${bufferWidth} x ${bufferHeight})`,
            start, end
        )

        const overworld = world.getDimension("overworld")

        for (var screenX = 0; screenX < width; screenX++) {
            for (var screenY = 0; screenY < height; screenY++) {
                const screenLoc = { x: blockLocation.x + screenX, y: blockLocation.y + screenY, z: blockLocation.z }
                overworld.getEntitiesAtBlockLocation(screenLoc)
                    .filter(e => e.typeId == "coslang:pixel")
                    .forEach(e => {
                        e.triggerEvent("coslang:despawn")
                    })
            }
        }

        const pixels = generateLargeDisplayCommands(pixelBuffer, blockLocation, width, height)
        const pixelEntities: Entity[] = []

        for (var i = 0; i < pixels.length; i++) {
            const pixel = pixels[i];
            const blockCorner = {
                x: blockLocation.x + 0.5 + pixel.screenX, 
                y: blockLocation.y + pixel.screenY, 
                z: blockLocation.z + 0.5
            }
            const pixelEntity = overworld.spawnEntity(`coslang:pixel<coslang:set_${pixel.x}_${pixel.y}>`, blockCorner);

            if (pixel.color != 0) {
                pixelEntity.triggerEvent(`coslang:set_color_${pixel.color}`)
            }

            if (pixel.width != 0 && pixel.height != 0) {
                pixelEntity.triggerEvent(`coslang:size_${pixel.width}_${pixel.height}`)
            }

            pixelEntities.push(pixelEntity);
        }

        return [null, ctx];
    })
]);