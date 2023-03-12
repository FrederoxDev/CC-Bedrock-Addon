import { BlockLocation, CommandResult, world } from "@minecraft/server";
import { Interpreter } from "../cosmic/src/Interpreter";
import { getBooleanLiteral } from "../cosmic/src/Primitives/Boolean";
import { getNumberLiteral } from "../cosmic/src/Primitives/Number";
import { getStringLiteral } from "../cosmic/src/Primitives/String";
import { NativeFunction } from "../cosmic/src/Struct/NativeFunction";
import { NativeFunctionHelper } from "../cosmic/src/Struct/NativeFunctionHelper";
import { StructInstance } from "../cosmic/src/Struct/StructInstance";
import { StructType } from "../cosmic/src/Struct/StructType";
console.log = console.warn

const validatePointOnScreen = (x: number, y: number, width: number, height: number, interpreter: Interpreter, start: number, end: number) => {
    if (x < 0 || x >= width || y < 0 || y >= width) {
        throw interpreter.runtimeErrorCode(
            `Pixel (${x}, ${y}) is outside of the pixel display!`,
            start,
            end
        )
    }

    return [x, y];
}

const isPointOnScreen = (x: number, y: number, width: number, height: number) => {
    return !(x < 0 || x >= width || y < 0 || y >= width)
}

const fontPoints = {
    "none": [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [1, 0], [2, 0], [3, 0], [4, 0], [1, 6], [2, 6], [3, 6], [4, 6]],
    "a": [[0,1],[1,4],[1,2],[1,0],[2,4],[2,2],[2,0],[3,4],[3,2],[3,0],[4,3],[4,2],[4,1],[4,0]],
    "b": [[0,6],[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],[1,3],[1,0],[2,4],[2,0],[3,4],[3,0],[4,3],[4,2],[4,1]],
    "c": [[0,3],[0,2],[0,1],[1,4],[1,0],[2,4],[2,0],[3,4],[3,0],[4,3],[4,1]],
    "d": [[0,3],[0,2],[0,1],[1,4],[1,0],[2,4],[2,0],[3,3],[3,0],[4,6],[4,5],[4,4],[4,3],[4,2],[4,1],[4,0]],
    "e": [[0,3],[0,2],[0,1],[1,4],[1,2],[1,0],[2,4],[2,2],[2,0],[3,4],[3,2],[3,0],[4,3],[4,2],[4,0]],
    "f": [[0,4],[1,5],[1,4],[1,3],[1,2],[1,1],[1,0],[2,6],[2,4],[3,6],[3,4]],
    "g": [[0,4],[0,3],[0,0],[1,5],[1,2],[1,0],[2,5],[2,2],[2,0],[3,5],[3,2],[3,0],[4,5],[4,4],[4,3],[4,2],[4,1]],
    "h": [[0,6],[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],[1,3],[2,4],[3,4],[4,3],[4,2],[4,1],[4,0]],
    "i": [[2,6],[2,4],[2,3],[2,2],[2,1],[2,0]],
    "j": [[0,2],[0,1],[1,0],[2,0],[3,0],[4,6],[4,4],[4,3],[4,2],[4,1]],
    "k": [[0,6],[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],[1,2],[2,3],[2,1],[3,4],[3,0]],
    "l": [[2,6],[2,5],[2,4],[2,3],[2,2],[2,1],[3,0]],
    "m": [[0,4],[0,3],[0,2],[0,1],[0,0],[1,4],[2,3],[2,2],[3,4],[4,3],[4,2],[4,1],[4,0]],
    "n": [[0,4],[0,3],[0,2],[0,1],[0,0],[1,4],[2,4],[3,4],[4,3],[4,2],[4,1],[4,0]],
    "o": [[0,3],[0,2],[0,1],[1,4],[1,0],[2,4],[2,0],[3,4],[3,0],[4,3],[4,2],[4,1]],
    "p": [[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],[1,4],[1,2],[2,5],[2,2],[3,5],[3,2],[4,4],[4,3]],
    "q": [[0,4],[0,3],[1,5],[1,2],[2,5],[2,2],[3,4],[3,2],[4,5],[4,4],[4,3],[4,2],[4,1],[4,0]],
    "r": [[0,4],[0,3],[0,2],[0,1],[0,0],[1,3],[2,4],[3,4],[4,3]],
    "s": [[0,3],[0,0],[1,4],[1,2],[1,0],[2,4],[2,2],[2,0],[3,4],[3,2],[3,0],[4,4],[4,1]],
    "t": [[1,5],[2,6],[2,5],[2,4],[2,3],[2,2],[2,1],[3,5],[3,0]],
    "u": [[0,4],[0,3],[0,2],[0,1],[1,0],[2,0],[3,0],[4,4],[4,3],[4,2],[4,1],[4,0]],
    "v": [[0,4],[0,3],[0,2],[1,1],[2,0],[3,1],[4,4],[4,3],[4,2]],
    "w": [[0,4],[0,3],[0,2],[0,1],[1,0],[2,2],[2,1],[2,0],[3,0],[4,4],[4,3],[4,2],[4,1],[4,0]],
    "x": [[0,4],[0,0],[1,3],[1,1],[2,2],[3,3],[3,1],[4,4],[4,0]],
    "y": [[0,5],[0,4],[0,3],[0,0],[1,2],[1,0],[2,2],[2,0],[3,2],[3,0],[4,5],[4,4],[4,3],[4,2],[4,1]],
    "z": [[0,4],[0,0],[1,4],[1,1],[1,0],[2,4],[2,2],[2,0],[3,4],[3,3],[3,0],[4,4],[4,0]],
    "0": [[0,5],[0,4],[0,3],[0,2],[0,1],[1,6],[1,2],[1,0],[2,6],[2,3],[2,0],[3,6],[3,4],[3,0],[4,5],[4,4],[4,3],[4,2],[4,1]],
    "1": [[0,0],[1,5],[1,0],[2,6],[2,5],[2,4],[2,3],[2,2],[2,1],[2,0],[3,0],[4,0]],
    "2": [[0,5],[0,1],[0,0],[1,6],[1,2],[1,0],[2,6],[2,3],[2,0],[3,6],[3,3],[3,0],[4,5],[4,4],[4,0]],
    "3": [[0,5],[0,1],[1,6],[1,0],[2,6],[2,3],[2,0],[3,6],[3,3],[3,0],[4,5],[4,4],[4,2],[4,1]],
    "4": [[0,3],[0,2],[1,4],[1,2],[2,5],[2,2],[3,6],[3,2],[4,6],[4,5],[4,4],[4,3],[4,2],[4,1],[4,0]],
    "5": [[0,6],[0,5],[0,4],[0,1],[1,6],[1,4],[1,0],[2,6],[2,4],[2,0],[3,6],[3,4],[3,0],[4,6],[4,3],[4,2],[4,1]],
    "6": [[0,4],[0,3],[0,2],[0,1],[1,5],[1,3],[1,0],[2,6],[2,3],[2,0],[3,6],[3,3],[3,0],[4,2],[4,1]],
    "7": [[0,6],[0,5],[1,6],[2,6],[2,2],[2,1],[2,0],[3,6],[3,3],[4,6],[4,5],[4,4]],
    "8": [[0,5],[0,4],[0,2],[0,1],[1,6],[1,3],[1,0],[2,6],[2,3],[2,0],[3,6],[3,3],[3,0],[4,5],[4,4],[4,2],[4,1]],
    "9": [[0,5],[0,4],[1,6],[1,3],[1,0],[2,6],[2,3],[2,0],[3,6],[3,3],[3,1],[4,5],[4,4],[4,3],[4,2]],
    " ": [],
    ":": [[2,6],[2,5],[2,2],[2,1]],
    "!": [[2,6],[2,5],[2,4],[2,3],[2,2],[2,0]],
    ",": [[2,2],[2,1],[2,0]]
}

export const PixelBuffer = new StructType("PixelBuffer", [
    new NativeFunction("New", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 2, start, end);
        const instance = new StructInstance(PixelBuffer);
        const width = getNumberLiteral(helper.expectType(0, "Number"));
        const height = getNumberLiteral(helper.expectType(1, "Number"));

        if (width <= 0 || height <= 0) throw interpreter.runtimeErrorCode(
            `PixelBuffer cannot have a width or height below 0, got width: ${width}, height: ${height}`,
            start, end
        )

        if (width % 16 != 0 || height % 16 != 0) throw interpreter.runtimeErrorCode(
            `Width (${width}) and Height (${height}) must both be divisible by 16`,
            start, end
        )

        instance.selfCtx.setProtected("bufferWidth", width)
        instance.selfCtx.setProtected("bufferHeight", height)
        instance.selfCtx.setProtected("pixelBuffer", new Array(width * height).fill(-1))
        return [instance, ctx];
    }),

    new NativeFunction("DrawPixel", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 3, start, end);
        var selfRef = ctx.stack.pop() as StructInstance;
        var screenBuffer = selfRef.selfCtx.getProtected<number[]>("pixelBuffer");
        var bufferWidth = selfRef.selfCtx.getProtected<number>("bufferWidth")

        const [x, y] = validatePointOnScreen(
            getNumberLiteral(helper.expectType(0, "Number")),
            getNumberLiteral(helper.expectType(1, "Number")),
            bufferWidth,
            selfRef.selfCtx.getProtected<number>("bufferHeight"),
            interpreter, start, end
        );
        const color = getNumberLiteral(helper.expectType(2, "Number"));

        screenBuffer[y * bufferWidth + x] = color;
        selfRef.selfCtx.setProtected("pixelBuffer", screenBuffer)
        return [null, ctx]
    }),

    new NativeFunction("DrawLine", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 5, start, end);
        var selfRef = ctx.stack.pop() as StructInstance;
        var screenBuffer = selfRef.selfCtx.getProtected<number[]>("pixelBuffer");
        var width = selfRef.selfCtx.getProtected<number>("bufferWidth");
        var height = selfRef.selfCtx.getProtected<number>("bufferHeight");

        var [x1, y1] = validatePointOnScreen(
            getNumberLiteral(helper.expectType(0, "Number")),
            getNumberLiteral(helper.expectType(1, "Number")),
            width, height, interpreter, start, end
        );

        var [x2, y2] = validatePointOnScreen(
            getNumberLiteral(helper.expectType(2, "Number")),
            getNumberLiteral(helper.expectType(3, "Number")),
            width, height, interpreter, start, end
        );

        const color = getNumberLiteral(helper.expectType(4, "Number"));

        // Get gradient of the line
        var [dx, dy] = [Math.abs(x2 - x1), Math.abs(y2 - y1)];
        var [sx, sy] = [Math.sign(x2 - x1), Math.sign(y2 - y1)];
        var [x, y] = [x1, y1];
        var err = dx - dy;

        while (x != x2 || y != y2) {
            screenBuffer[y * width + x] = color;
            var e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        screenBuffer[y * width + x] = color;
        selfRef.selfCtx.setProtected("pixelBuffer", screenBuffer)
        return [null, ctx]
    }),

    new NativeFunction("DrawCircle", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 5, start, end);
        var selfRef = ctx.stack.pop() as StructInstance;
        var screenBuffer = selfRef.selfCtx.getProtected<number[]>("pixelBuffer");
        var bufferWidth = selfRef.selfCtx.getProtected<number>("bufferWidth");
        var bufferHeight = selfRef.selfCtx.getProtected<number>("bufferHeight");

        const centerX = getNumberLiteral(helper.expectType(0, "Number"))
        const centerY = getNumberLiteral(helper.expectType(1, "Number"))
        const radius = getNumberLiteral(helper.expectType(2, "Number"))
        const shouldFill = !getBooleanLiteral(helper.expectType(3, "Boolean"))
        const color = getNumberLiteral(helper.expectType(4, "Number"))

        for (var xOff = -radius; xOff <= radius; xOff++) {
            for (var yOff = -radius; yOff <= radius; yOff++) {
                var x = centerX + xOff;
                var y = centerY + yOff;
                if (!isPointOnScreen(x, y, bufferWidth, bufferHeight)) continue;
                const c = Math.sqrt(xOff * xOff + yOff * yOff)
                if (c > radius || (c < radius - 1 && shouldFill)) continue;

                screenBuffer[y * bufferWidth + x] = color;
            }
        }

        return [null, ctx];
    }),

    new NativeFunction("DrawText", async (interpreter, ctx, start, end, args) => {
        const helper = new NativeFunctionHelper(interpreter, args, 1, start, end);
        var selfRef = ctx.stack.pop() as StructInstance;
        var screenBuffer = selfRef.selfCtx.getProtected<number[]>("pixelBuffer");
        var bufferWidth = selfRef.selfCtx.getProtected<number>("bufferWidth");
        var bufferHeight = selfRef.selfCtx.getProtected<number>("bufferHeight");
        const text = getStringLiteral(helper.expectType(0, "String"))
        const characters = text.split("");

        var charHeight = 7;
        var charWidth = 5;
        var x = 0;
        var y = bufferHeight - charHeight;

        for (var i = 0; i < characters.length; i++) {
            var points = fontPoints[characters[i]] ?? fontPoints.none;

            points.forEach(point => {
                var pointX = x + point[0];
                var pointY = y + point[1];
                screenBuffer[pointY * bufferWidth + pointX] = 0;
            })

            if (x + charWidth + 1 < bufferWidth - 2) x += charWidth + 1;
            else {
                x = 0;
                y -= charHeight + 1;
            }
        }

        selfRef.selfCtx.setProtected("pixelBuffer", screenBuffer)
        return [null, ctx];
    })
]);
