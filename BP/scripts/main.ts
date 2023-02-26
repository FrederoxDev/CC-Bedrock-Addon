import { runScript } from "./run";
import { world, system, MinecraftEntityTypes, DynamicPropertiesDefinition, EntityTypes } from "@minecraft/server"
import { Directory, textDirectory, File, resolvePath, makeDirectory } from "./FileSystem";

// Reassign .log because it does not exist in public
console.log = console.warn;

// Player Properties
const connectedTurtleProp = "connectedTurtle";

// Turtle Properties
const turtleFilesProp = "turtleFiles";
const turtleIdProp = "turtleId";

// World Properties
const nextTurtleIdProp = "nextTurtleId";

// Property registration
world.events.worldInitialize.subscribe(({ propertyRegistry }) => {
    const playerType = MinecraftEntityTypes.player
    const playerData = new DynamicPropertiesDefinition();
    playerData.defineNumber(connectedTurtleProp);
    propertyRegistry.registerEntityTypeDynamicProperties(playerData, playerType);

    const turtleType = EntityTypes.get("coslang:turtle_controller");
    const turtleData = new DynamicPropertiesDefinition();
    turtleData.defineString(turtleFilesProp, 4294967295);
    turtleData.defineNumber(turtleIdProp);
    propertyRegistry.registerEntityTypeDynamicProperties(turtleData, turtleType);

    const worldData = new DynamicPropertiesDefinition();
    worldData.defineNumber(nextTurtleIdProp);
    propertyRegistry.registerWorldDynamicProperties(worldData);
})

// When a new turtle is placed in the world it needs to be assigned an
// turtleId, as well as base files. This is stored in coslang:turtle_controller
world.events.blockPlace.subscribe(e => {
    if (e.block.typeId !== "coslang:turtle") return;
    const controller = e.dimension.spawnEntity("coslang:turtle_controller", e.block.location);
    const nextId = (world.getDynamicProperty(nextTurtleIdProp) as number) ?? 0;
    controller.setDynamicProperty(turtleIdProp, nextId + 1);
    controller.setDynamicProperty(turtleFilesProp, "{}");
    world.setDynamicProperty(nextTurtleIdProp, nextId + 1);
})

// When a turtle is broken in the world, need to kill the coslang:turtle_controller
world.events.blockBreak.subscribe(e => {
    if (e.brokenBlockPermutation.type.id !== "coslang:turtle") return;
    const turtles = e.dimension.getEntitiesAtBlockLocation(e.block.location)
        .filter(entity => entity.typeId == "coslang:turtle_controller");

    turtles.map(turtle => turtle.kill())
})

// When a turtle is clicked on the player should get a reference to the entity
world.events.itemUseOn.subscribe(e => {
    const dimension = e.source.dimension
    const block = dimension.getBlock(e.blockLocation);
    if (block.typeId != "coslang:turtle") return;
    
    const turtles = dimension.getEntitiesAtBlockLocation(e.blockLocation)
        .filter(entity => entity.typeId == "coslang:turtle_controller");

    if (turtles.length < 1) return console.log("Unable to find turtle controller!");
    if (turtles.length > 1) return console.log("Multiple turtle controllers found!");

    const turtle = turtles[0];
    e.source.setDynamicProperty(connectedTurtleProp, turtle.getDynamicProperty(turtleIdProp)!);
    world.say(`Turtle ${turtle.getDynamicProperty(turtleIdProp)} is now connected!`)
})

var files: Directory = {
    type: "Directory",
    name: "root",
    files: []
}

var currentPath: string[] = []

// Command line
world.events.beforeChat.subscribe(e => {
    if (!e.message.startsWith(">")) return;
    const message = e.message.substring(1).trimStart();
    const [command, ...rest] = message.split(" "); 
    const turtleId = (e.sender.getDynamicProperty(connectedTurtleProp) as string | undefined);
    e.targets = [e.sender]

    // Check the player is connected to a turtle
    if (turtleId === undefined) {
        e.message = "[No Turtle Connected]"
        return;
    }

    // List Files
    if (command == "dir") {
        e.message = textDirectory(resolvePath(files, currentPath) as Directory);
    }

    // Changing directories with relative paths
    if (command == "cd") {
        const relative = rest[0].split("/")
        const newPath = currentPath
        
        for (var i = 0; i < relative.length; i++) {
            if (relative[i] == "..") newPath.pop();
            else newPath.push(relative[i])
        }

        const dir = resolvePath(files, newPath);
        if (dir.type == "FileError") {
            e.message = `Error: ${dir.error}`
            return;
        } 

        currentPath = newPath;
        e.message = `§7/${newPath.join("/")}>§r`
    }

    if (command == "mkdir") {
        const name = rest[0];
        const newFiles = makeDirectory(files, currentPath, name);
        if (newFiles.type == "FileError") {
            e.message = `Error: ${newFiles.error}`
            return;
        }
        files = newFiles;
        e.message = `§7/${currentPath.join("/")}>`;
    }
})