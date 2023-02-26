import { BlockLocation, BlockType, system, world, MinecraftBlockTypes, BlockPermutation, Block } from "@minecraft/server"
import { NativeFunction } from "../coslang/src/Interpreter/Primitives/NativeFunction"
import { Struct } from "../coslang/src/Interpreter/Primitives/Struct";

const movementDelayInTicks = 10;

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
    const block = world.getDimension("overworld").getBlock(blockLocation)
    block.setType(MinecraftBlockTypes.get("coslang:turtle"));

    // Rotation
    const permutation = block.permutation;
    // @ts-ignore Missing Field on type IBlockProperty
    permutation.getProperty("coslang:rotation").value = rotation;
    block.setPermutation(permutation);    
}

const overworld = world.getDimension("overworld")

export const Turtle = new Struct("Turtle", [], [
    new NativeFunction("Forward", async (interpreter, ctx, args) => {
        const oldPosition: [number, number, number] = ctx.getProtectedData("position");
        const rotation = ctx.getProtectedData("rotation");
        const position = [...oldPosition]
        if (rotation % 4 == 0) position[0] += 1;
        else if (rotation % 4 == 1) position[2] -= 1;
        else if (rotation % 4 == 2) position[0] -= 1;
        else if (rotation % 4 == 3) position[2] += 1;

        drawTurtle(oldPosition, position, rotation % 4);
        ctx.setProtectedData("position", position);

        await delay()
        return [null, ctx];
    }),

    new NativeFunction("TurnRight", async (interpreter, ctx, args) => {
        const position: [number, number, number] = ctx.getProtectedData("position");
        var rotation: number = ctx.getProtectedData("rotation") - 1;
        if (rotation > 3) rotation = 0;
        if (rotation < 0) rotation = 3;

        drawTurtle(position, position, rotation % 4);
        ctx.setProtectedData("rotation", rotation);

        await delay()
        return [null, ctx];
    }),

    new NativeFunction("TurnLeft", async (interpreter, ctx, args) => {
        const position: [number, number, number] = ctx.getProtectedData("position");
        var rotation: number = ctx.getProtectedData("rotation") + 1;
        if (rotation > 3) rotation = 0;
        if (rotation < 0) rotation = 3;

        drawTurtle(position, position, rotation % 4);
        ctx.setProtectedData("rotation", rotation);

        await delay()
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