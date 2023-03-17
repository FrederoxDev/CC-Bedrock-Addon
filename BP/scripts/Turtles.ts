import { BlockBreakEvent, BlockPlaceEvent, ItemUseOnEvent, world } from "@minecraft/server";
import { nextTurtleIdProp, turtleIdProp, connectedTurtleProp } from "./Properties";

export const OnTurtlePlace = (e: BlockPlaceEvent) => {
    if (e.block.typeId !== "coslang:turtle") return;
    const controller = e.dimension.spawnEntity("coslang:turtle_controller", e.block.location);
    const nextId = (world.getDynamicProperty(nextTurtleIdProp) as number) ?? 0;
    controller.setDynamicProperty(turtleIdProp, nextId + 1);
    const midPos = {
        x: e.block.location.x + 0.5,
        y: e.block.location.y,
        z: e.block.location.z + 0.5
    }
    controller.teleport(midPos, controller.dimension, 0, 0, false)
    world.setDynamicProperty(nextTurtleIdProp, nextId + 1);
    controller.nameTag = `Turtle: ${nextId + 1}`;
}

export const OnTurtleBreak = (e: BlockBreakEvent) => {
    if (e.brokenBlockPermutation.type.id !== "coslang:turtle") return;
    const turtles = e.dimension.getEntitiesAtBlockLocation(e.block.location)
        .filter(entity => entity.typeId == "coslang:turtle_controller");

    turtles.map(turtle => turtle.kill())
}

export const OnTurtleInteract = (e: ItemUseOnEvent) => {
    const dimension = e.source.dimension
    const block = dimension.getBlock(e.getBlockLocation());
    if (block.typeId != "coslang:turtle") return;

    const turtles = dimension.getEntitiesAtBlockLocation(e.getBlockLocation())
        .filter(entity => entity.typeId == "coslang:turtle_controller");

    if (turtles.length < 1) return console.log("Unable to find turtle controller!");
    if (turtles.length > 1) return console.log("Multiple turtle controllers found!");

    const turtle = turtles[0];
    const turtleID = turtle.getDynamicProperty(turtleIdProp) as number
    e.source.setDynamicProperty(connectedTurtleProp, turtleID!);
    world.sendMessage(`Turtle ${turtleID} is now connected!`)
}