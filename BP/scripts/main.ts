import { runScript } from "./run";
import { world, system, MinecraftEntityTypes, DynamicPropertiesDefinition, EntityTypes, Player } from "@minecraft/server"
import { ModalFormData } from "@minecraft/server-ui"
import { Directory, makeDirectory, directoryTree, resolveDirectory, makeFile, openFile, readFile, File } from "./FileSystem";

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
    files: [
        {
            name: "data.bin",
            type: "File",
            content: "01001"
        }
    ],
    directories: [
        {
            type: "Directory",
            name: "programs",
            directories: [
                {
                    name: "old",
                    type: "Directory",
                    directories: [],
                    files: [
                        {
                            name: "hello_world.cos",
                            type: "File",
                            content: 'log("hello world");'
                        }
                    ]
                }
            ],
            files: [
                {
                    name: "main.cos",
                    type: "File",
                    content: "let x = 12;"
                },
                {
                    name: "mine.cos",
                    type: "File",
                    content: "let x = 12;"
                }
            ]
        }
    ]
}

var currentPath: string[] = []

// Command line
world.events.beforeChat.subscribe(async e => {
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

    // Tree command
    if (command == "tree") {
        const resolved = resolveDirectory(files, currentPath)
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

        const dir = resolveDirectory(files, newPath);
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
        const newFiles = makeDirectory(files, currentPath, name);
        if (newFiles.type == "FileError") {
            e.message = `Error: ${newFiles.error}`
            return;
        }
        files = newFiles;
        e.message = `§7/${currentPath.join("/")}>`;
    }

    // Make files
    if (command == "new") {
        const name = rest[0];
        const newFiles = makeFile(files, currentPath, name);
        if (newFiles.type == "FileError") {
            e.message = `Error: ${newFiles.error}`
            return;
        }
        files = newFiles;
        e.message = `§7${currentPath.join("/")}/${name}`;
    }

    // Write files
    if (command == "edit") {
        const name = rest[0];
        const file = readFile(files, currentPath, name) as File;
        const newContent = await openFile(e.sender, name, file.content);
    }
})