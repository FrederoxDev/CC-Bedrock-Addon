import { NativeFunction } from "../coslang/Interpreter/Primitives/NativeFunction";
import { Struct } from "../coslang/Interpreter/Primitives/Struct";
import { parseBinaryArgsAssertType } from "../coslang/Interpreter/Structs/StructCommon";
import { BlockLocation, BlockType, system, world, MinecraftBlockTypes } from "@minecraft/server"

const movementDelayInTicks = 20;

function delay(): Promise<void> {
    return new Promise(resolve => {
        const id = system.runSchedule(() => {
            system.clearRun(id);
            resolve()
        }, movementDelayInTicks)
    });
}

export function drawTurtle(oldPosition, position, rotation) {
    // Erase old
    const oldBlockLocation = new BlockLocation(oldPosition[0], oldPosition[1], oldPosition[2]);
    world.getDimension("overworld").getBlock(oldBlockLocation).setType(MinecraftBlockTypes.get("minecraft:air"))

    // Draw new
    const blockLocation = new BlockLocation(position[0], position[1], position[2]);
    world.getDimension("overworld").getBlock(blockLocation).setType(MinecraftBlockTypes.get("coslang:turtle"))
}

const overworld = world.getDimension("overworld")

export const Turtle = new Struct("Turtle", [], [
    new NativeFunction("Forward", async (interpreter, ctx, args) => {
        await delay()
        const oldPosition: [number, number, number] = ctx.getProtectedData("position");
        const position = [...oldPosition]
        position[0] += 1

        drawTurtle(oldPosition, position, 0);
        ctx.setProtectedData("position", position);

        return [null, ctx];
    }),

    new NativeFunction("InspectDown", async (interpreter, ctx, args) => {
        await delay()
        const position: [number, number, number] = ctx.getProtectedData("position");
        const blockLocation = new BlockLocation(position[0], position[1] - 1, position[2]);

        const blockId = overworld.getBlock(blockLocation).typeId;
        return interpreter.primitiveString({ value: `${blockId}` }, ctx)
    })
])