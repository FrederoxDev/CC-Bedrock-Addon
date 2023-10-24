import { ItemStartUseOnAfterEvent, PlayerBreakBlockAfterEvent, PlayerPlaceBlockAfterEvent, Vector, world } from "@minecraft/server";
import { nextTurtleIdProp, turtleIdProp, connectedTurtleProp } from "./Properties";

export const OnTurtlePlace = (e: PlayerPlaceBlockAfterEvent) => {
    if (e.block.typeId !== "coslang:turtle") return;
    const controller = e.dimension.spawnEntity("coslang:turtle_controller", e.block.location);
    const nextId = (world.getDynamicProperty(nextTurtleIdProp) as number) ?? 0;
    controller.setDynamicProperty(turtleIdProp, nextId + 1);
    const midPos = {
        x: e.block.location.x + 0.5,
        y: e.block.location.y,
        z: e.block.location.z + 0.5
    }
    controller.teleport(midPos,{ dimension : controller.dimension, facingLocation : new Vector(0, 0, 0), keepVelocity : false })
    world.setDynamicProperty(nextTurtleIdProp, nextId + 1);
    controller.nameTag = `Turtle: ${nextId + 1}`;
}

export const OnTurtleBreak = (e: PlayerBreakBlockAfterEvent) => {
    if (e.brokenBlockPermutation.type.id !== "coslang:turtle") return;
    const turtles = e.dimension.getEntitiesAtBlockLocation(e.block.location)
        .filter(entity => entity.typeId == "coslang:turtle_controller");

    turtles.map(turtle => turtle.kill())
}

export const OnTurtleInteract = (e: ItemStartUseOnAfterEvent) => {
    const dimension = e.source.dimension
    const block = dimension.getBlock(e.block.location);
    if (block?.typeId != "coslang:turtle") return;

    const turtles = dimension.getEntitiesAtBlockLocation(e.block.location)
        .filter(entity => entity.typeId == "coslang:turtle_controller");

    if (turtles.length < 1) return console.log("Unable to find turtle controller!");
    if (turtles.length > 1) return console.log("Multiple turtle controllers found!");

    const turtle = turtles[0];
    const turtleID = turtle.getDynamicProperty(turtleIdProp) as number
    e.source.setDynamicProperty(connectedTurtleProp, turtleID!);
    world.sendMessage(`Turtle ${turtleID} is now connected!`)
}