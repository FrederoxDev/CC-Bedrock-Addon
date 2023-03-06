import { BlockLocation, BlockType, system, world, MinecraftBlockTypes, BlockPermutation, Block, Entity, Vector, EntityItemComponent, EntityInventoryComponent, ItemStack, MinecraftItemTypes, ItemType, ItemTypes } from "@minecraft/server"
import { NativeFunction } from "../cosmic/src/Struct/NativeFunction";
import { StructType } from "../cosmic/src/Struct/StructType";

const movementDelayInTicks = 10;
console.log = console.warn

function delay(): Promise<void> {
    return new Promise(resolve => {
        const id = system.runSchedule(() => {
            system.clearRun(id);
            resolve()
        }, movementDelayInTicks)
    });
}

export function drawTurtle(oldPosition, position, rotation, ctx) {
    // Move the entity controller
    const entity = ctx.getProtectedData("entity") as Entity
    entity.teleport(new Vector(position[0] + 0.5, position[1], position[2] + 0.5), entity.dimension, 0, 0, false)

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

const pickUpBlock = (blockPos: BlockLocation, inventory: EntityInventoryComponent) => {
    overworld.getEntitiesAtBlockLocation(blockPos).forEach(entity => {
        if (entity.typeId == "minecraft:item") {
            const itemComponent = entity.getComponent("minecraft:item") as EntityItemComponent

            // The item will always fit
            if (inventory.container.emptySlotsCount > 0) {
                inventory.container.addItem(itemComponent.itemStack)
                entity.kill()
            }
            else {
                var remainingItems = itemComponent.itemStack.amount;
                
                for (var i = 0; i < 16; i++) {
                    const slot = inventory.container.getItem(i);
                    if (slot.typeId != itemComponent.itemStack.typeId) continue;

                    const startAmount = slot.amount;
                    const itemType = ItemTypes.get(slot.typeId)
                    const newItemStack = new ItemStack(itemType, Math.min(slot.amount + remainingItems, 64));

                    const itemsAdded = newItemStack.amount - startAmount;
                    if (itemsAdded > 0) inventory.container.setItem(i, newItemStack);
                    remainingItems -= itemsAdded;

                    if (remainingItems == 0) break; 
                }
                
                if (remainingItems > 0) {
                    const type = ItemTypes.get(itemComponent.itemStack.typeId)
                    const blockLoc = new BlockLocation(
                        Math.floor(entity.location.x), 
                        Math.floor(entity.location.y), 
                        Math.floor(entity.location.z)
                    )
                    overworld.spawnItem(new ItemStack(type, remainingItems, itemComponent.itemStack.data), blockLoc)
                }
                entity.kill();
            }
        }
    })
}

export const Turtle = new StructType("Turtle", [
    // new NativeFunction("Forward", async (interpreter, ctx, args) => {
    //     await delay()
    //     const oldPosition: [number, number, number] = ctx.getProtectedData("position");
    //     const rotation = ctx.getProtectedData("rotation");
    //     const position = [...oldPosition]
    //     if (rotation % 4 == 0) position[0] += 1;
    //     else if (rotation % 4 == 1) position[2] -= 1;
    //     else if (rotation % 4 == 2) position[0] -= 1;
    //     else if (rotation % 4 == 3) position[2] += 1;
    //     const blockPos = new BlockLocation(position[0], position[1], position[2])

    //     if (!overworld.getBlock(blockPos).canPlace(MinecraftBlockTypes.stone)) return [null, ctx]

    //     drawTurtle(oldPosition, position, rotation % 4, ctx);
    //     ctx.setProtectedData("position", position);
        
    //     return [null, ctx];
    // }),

    // new NativeFunction("TurnRight", async (interpreter, ctx, args) => {
    //     await delay()
    //     const position: [number, number, number] = ctx.getProtectedData("position");
    //     var rotation: number = ctx.getProtectedData("rotation") - 1;
    //     if (rotation > 3) rotation = 0;
    //     if (rotation < 0) rotation = 3;

    //     drawTurtle(position, position, rotation % 4, ctx);
    //     ctx.setProtectedData("rotation", rotation);

        
    //     return [null, ctx];
    // }),

    // new NativeFunction("TurnLeft", async (interpreter, ctx, args) => {
    //     await delay()
    //     const position: [number, number, number] = ctx.getProtectedData("position");
    //     var rotation: number = ctx.getProtectedData("rotation") + 1;
    //     if (rotation > 3) rotation = 0;
    //     if (rotation < 0) rotation = 3;

    //     drawTurtle(position, position, rotation % 4, ctx);
    //     ctx.setProtectedData("rotation", rotation);
        
    //     return [null, ctx];
    // }),

    // new NativeFunction("Inspect", async (interpreter, ctx, args) => {
    //     const [...position] = ctx.getProtectedData("position");
    //     const rotation = ctx.getProtectedData("rotation");

    //     if (rotation % 4 == 0) position[0] += 1;
    //     else if (rotation % 4 == 1) position[2] -= 1;
    //     else if (rotation % 4 == 2) position[0] -= 1;
    //     else if (rotation % 4 == 3) position[2] += 1;
    //     const blockPos = new BlockLocation(position[0], position[1], position[2])

    //     const blockId = overworld.getBlock(blockPos).typeId;
    //     return interpreter.primitiveString({ value: `${blockId}` }, ctx)
    // }),

    // new NativeFunction("InspectDown", async (interpreter, ctx, args) => {
    //     const position: [number, number, number] = ctx.getProtectedData("position");
    //     const blockLocation = new BlockLocation(position[0], position[1] - 1, position[2]);

    //     const blockId = overworld.getBlock(blockLocation).typeId;
    //     return interpreter.primitiveString({ value: `${blockId}` }, ctx)
    // }),

    // new NativeFunction("InspectUp", async (interpreter, ctx, args) => {
    //     const position: [number, number, number] = ctx.getProtectedData("position");
    //     const blockLocation = new BlockLocation(position[0], position[1] + 1, position[2]);

    //     const blockId = overworld.getBlock(blockLocation).typeId;
    //     return interpreter.primitiveString({ value: `${blockId}` }, ctx)
    // }),

    // new NativeFunction("Dig", async (interpreter, ctx, args) => {
    //     const [...position] = ctx.getProtectedData("position");
    //     const rotation = ctx.getProtectedData("rotation");

    //     if (rotation % 4 == 0) position[0] += 1;
    //     else if (rotation % 4 == 1) position[2] -= 1;
    //     else if (rotation % 4 == 2) position[0] -= 1;
    //     else if (rotation % 4 == 3) position[2] += 1;
    //     const blockPos = new BlockLocation(position[0], position[1], position[2])

    //     await delay()
    //     await overworld.runCommandAsync(`setblock ${position[0]} ${position[1]} ${position[2]} air 0 destroy`)
    //     const inventory = (ctx.getProtectedData("entity") as Entity).getComponent("minecraft:inventory") as EntityInventoryComponent;
    //     pickUpBlock(blockPos, inventory)

    //     return [null, ctx]
    // }),

    // new NativeFunction("DigUp", async (interpreter, ctx, args) => {
    //     const [...position] = ctx.getProtectedData("position");
    //     const blockPos = new BlockLocation(position[0], position[1] + 1, position[2])

    //     await delay()
    //     await overworld.runCommandAsync(`setblock ${position[0]} ${position[1] + 1} ${position[2]} air 0 destroy`)
    //     const inventory = (ctx.getProtectedData("entity") as Entity).getComponent("minecraft:inventory") as EntityInventoryComponent;
    //     pickUpBlock(blockPos, inventory)

    //     return [null, ctx]
    // }),

    // new NativeFunction("DigDown", async (interpreter, ctx, args) => {
    //     const [...position] = ctx.getProtectedData("position");
    //     const blockPos = new BlockLocation(position[0], position[1] - 1, position[2])

    //     await delay()
    //     await overworld.runCommandAsync(`setblock ${position[0]} ${position[1] - 1} ${position[2]} air 0 destroy`)
    //     const inventory = (ctx.getProtectedData("entity") as Entity).getComponent("minecraft:inventory") as EntityInventoryComponent;
    //     pickUpBlock(blockPos, inventory)

    //     return [null, ctx]
    // }),
])