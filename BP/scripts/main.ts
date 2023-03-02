import { TurtleInterpreter } from "./run";
import { world, system, MinecraftEntityTypes, DynamicPropertiesDefinition, EntityTypes, Player, Entity, EntityInventoryComponent } from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import { Directory, makeDirectory, directoryTree, resolveDirectory, makeFile, openFile, readFile, File, writeFile, FileError } from "./FileSystem";

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
    world.setDynamicProperty(nextTurtleIdProp, nextId + 1);
    controller.nameTag = `Turtle: ${nextId + 1}`;
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
    const turtleID = turtle.getDynamicProperty(turtleIdProp) as number
    e.source.setDynamicProperty(connectedTurtleProp, turtleID!);
    world.say(`Turtle ${turtleID} is now connected!`)
})

var currentPath: string[] = []

// Command line
world.events.beforeChat.subscribe(async e => {
    if (!e.message.startsWith(">")) return;
    const message = e.message.substring(1).trimStart();
    const [command, ...rest] = message.split(" ");
    const turtleId = (e.sender.getDynamicProperty(connectedTurtleProp) as string | undefined);
    const allTurtles = Array.from(e.sender.dimension.getEntities({ type: "coslang:turtle_controller" }))

    var turtle: Entity | null = null;
    for (var i = 0; i < allTurtles.length; i++) {
        if (allTurtles[i].getDynamicProperty(turtleIdProp) == turtleId) {
            turtle = allTurtles[i];
            break;
        }
    }

    if (turtle == null) {
        world.say("Turtle with ID " + turtleId + " not found!")
        return;
    }

    const emptyFS: Directory = { name: "root", type: "Directory", directories: [], files: [] }
    const turtleString: string | undefined = allTurtles[i].getDynamicProperty(turtleFilesProp) as string | undefined
    const turtleFiles: Directory = turtleString == undefined ? emptyFS : JSON.parse(turtleString);

    e.targets = [e.sender]

    // Check the player is connected to a turtle
    if (turtleId === undefined) {
        e.message = "[No Turtle Connected]"
        return;
    }

    // Tree command
    if (command == "tree") {
        const resolved = resolveDirectory(turtleFiles, currentPath)
        if (resolved.type == "FileError") {
            e.message = resolved.error;
            return;
        }
        e.message = directoryTree(resolved);
    }

    // Changing directories with relative paths
    if (command == "cd") {
        const relative = rest[0].split("/")
        const newPath = currentPath

        for (var i = 0; i < relative.length; i++) {
            if (relative[i] == "..") newPath.pop();
            else newPath.push(relative[i])
        }

        const dir = resolveDirectory(turtleFiles, newPath);
        if (dir.type == "FileError") {
            e.message = `Error: ${dir.error}`
            return;
        }

        currentPath = newPath;
        e.message = `§7/${newPath.join("/")}>§r`
    }

    // Make directories
    if (command == "mkdir") {
        const name = rest[0];
        const newFiles = makeDirectory(turtleFiles, currentPath, name);
        if (newFiles.type == "FileError") {
            e.message = `Error: ${newFiles.error}`
            return;
        }
        turtle.setDynamicProperty(turtleFilesProp, JSON.stringify(turtleFiles))
        e.message = `§7/${currentPath.join("/")}>`;
    }

    // Make files
    if (command == "new") {
        const name = rest[0];
        const newFiles = makeFile(turtleFiles, currentPath, name);
        if (newFiles.type == "FileError") {
            e.message = `Error: ${newFiles.error}`
            return;
        }
        turtle.setDynamicProperty(turtleFilesProp, JSON.stringify(turtleFiles))
        e.message = `§7${currentPath.join("/")}/${name}`;
    }

    // Write files
    if (command == "edit") {
        const name = rest[0];
        const file = readFile(turtleFiles, currentPath, name) as File | FileError;
        if (file.type == "FileError") return world.say(file.error);
        const newContent = await openFile(e.sender, name, file.content);
        writeFile(turtleFiles, currentPath, name, newContent);
        turtle.setDynamicProperty(turtleFilesProp, JSON.stringify(turtleFiles))
    }

    if (command == "run") {
        try {
            const name = rest[0];
            const file = readFile(turtleFiles, currentPath, name) as File | FileError;
            if (file.type == "FileError") return world.say(file.error);

            // Execute the file
            const turtleInterpreter = new TurtleInterpreter(turtle);
            await turtleInterpreter.runScript(file.content)

            world.say(`Finished running ${file.name}`);
        } catch (e) {
            world.say("Error")
            world.say(e.stack)
            throw e
        }
    }

    if (command == "inventory") {
        const inventory = turtle.getComponent("minecraft:inventory") as EntityInventoryComponent

        for (var i = 0; i < 16; i++) {
            const item = inventory.container.getItem(i)
            if (item == undefined) continue;
            world.say(`§7${i}.§r ${item.typeId} - ${item.amount}`)
        }

        e.cancel = true
    }
})