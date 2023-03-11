import { BlockLocation, CommandResult, world } from "@minecraft/server";
import { Interpreter } from "../cosmic/src/Interpreter";
import { getNumberLiteral } from "../cosmic/src/Primitives/Number";
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
    })
]);