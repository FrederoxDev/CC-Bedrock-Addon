// import { TurtleInterpreter } from "./run";
import { world, Entity, EntityInventoryComponent } from "@minecraft/server"
import { OnTurtleBreak, OnTurtleInteract, OnTurtlePlace } from "./Turtles";
import { Directory, makeDirectory, directoryTree, resolveDirectory, makeFile, openFile, readFile, File, writeFile, FileError, deleteDirectory, deleteFile } from "./FileSystem";
import { connectedTurtleProp, InitializeProperties, turtleFilesProp, turtleIdProp } from "./Properties";
import { TurtleInterpreter } from "./run";

world.afterEvents.worldInitialize.subscribe(InitializeProperties);
world.afterEvents.playerPlaceBlock.subscribe(OnTurtlePlace);
world.afterEvents.playerBreakBlock.subscribe(OnTurtleBreak);
world.afterEvents.itemUseOn.subscribe(OnTurtleInteract);

var currentPath: string[] = [];

// Command line
world.beforeEvents.chatSend.subscribe(async e => {
    try {
        if (!e.message.startsWith(">")) return;
        const message = e.message.substring(1).trimStart();
        const [command, ...rest] = message.split(" ");
        const turtleId = (e.sender.getDynamicProperty(connectedTurtleProp) as string | undefined);
        if (turtleId === undefined) {
            world.sendMessage("[No Turtle Connected]")
            return;
        }
        const allTurtles = Array.from(e.sender.dimension.getEntities({ type: "coslang:turtle_controller" }))

        var turtle: Entity | null = null;
        for (var i = 0; i < allTurtles.length; i++) {
            if (allTurtles[i].getDynamicProperty(turtleIdProp) == turtleId) {
                turtle = allTurtles[i];
                break;
            }
        }

        if (turtle == null) {
            world.sendMessage("Turtle with ID " + turtleId + " not found!")
            return;
        }

        const emptyFS: Directory = { name: "root", type: "Directory", directories: [], files: [] }
        const turtleString: string | undefined = allTurtles[i].getDynamicProperty(turtleFilesProp) as string | undefined
        const turtleFiles: Directory = turtleString == undefined ? emptyFS : JSON.parse(turtleString);

        e.cancel = true;

        // Check the player is connected to a turtle
        if (turtleId === undefined) {
            world.sendMessage("[No Turtle Connected]");
            return;
        }
        //Help command
        else if (command == "help"){
            world.sendMessage(`Command list:
            -help
            -tree
            -cd
            -mkdir
            -rmdir
            -new
            -del
            -edit
            -run
            -inventory`)
        }
        // Tree command
        else if (command == "tree") {
            const resolved = resolveDirectory(turtleFiles, currentPath)
            if (resolved.type == "FileError") {
                world.sendMessage(resolved.error);
                return;
            }
            world.sendMessage(directoryTree(resolved));
        }

        // Changing directories with relative paths
        else if (command == "cd") {
            const relative = rest[0].split("/")
            const newPath = currentPath

            for (var i = 0; i < relative.length; i++) {
                if (relative[i] == "..") newPath.pop();
                else newPath.push(relative[i])
            }

            const dir = resolveDirectory(turtleFiles, newPath);
            if (dir.type == "FileError") {
                world.sendMessage(`Error: ${dir.error}`)
                return;
            }

            currentPath = newPath;
            world.sendMessage(`§7/${newPath.join("/")}>§r`)
        }

        // Make directories
        else if (command == "mkdir") {
            const name = rest[0];
            const newFiles = makeDirectory(turtleFiles, currentPath, name);
            if (newFiles.type == "FileError") {
                world.sendMessage(`Error: ${newFiles.error}`);
                return;
            }
            turtle.setDynamicProperty(turtleFilesProp, JSON.stringify(turtleFiles))
            world.sendMessage(`§7/${currentPath.join("/")}>`);
            return;
        }

        else if (command == "rmdir") {
            const name = rest[0];
            const newFiles = deleteDirectory(turtleFiles, currentPath, name);
            if (newFiles.type == "FileError") {
                world.sendMessage(`Error: ${newFiles.error}`)
                return;
            }
            turtle.setDynamicProperty(turtleFilesProp, JSON.stringify(turtleFiles))
            world.sendMessage(`§7/${currentPath.join("/")}>`);
            return;
        }

        // Make files
        else if (command == "new") {
            const name = rest[0];
            const newFiles = makeFile(turtleFiles, currentPath, name);
            if (newFiles.type == "FileError") {
                world.sendMessage(`Error: ${newFiles.error}`)
                return;
            }
            turtle.setDynamicProperty(turtleFilesProp, JSON.stringify(turtleFiles))
            world.sendMessage(`§7${currentPath.join("/")}/${name}`);
            return;
        }

        else if (command == "del") {
            const name = rest[0];
            const newFiles = deleteFile(turtleFiles, currentPath, name);
            if (newFiles.type == "FileError") {
                world.sendMessage(`Error: ${newFiles.error}`)
                return;
            }
            turtle.setDynamicProperty(turtleFilesProp, JSON.stringify(turtleFiles))
            world.sendMessage(`§7${currentPath.join("/")}/${name}`);
            return;
        }

        // Write files
        else if (command == "edit") {
            const name = rest[0];
            const file = readFile(turtleFiles, currentPath, name) as File | FileError;
            if (file.type == "FileError") return world.sendMessage(file.error);
            const newContent = await openFile(e.sender, name, file.content);
            writeFile(turtleFiles, currentPath, name, newContent);
            turtle.setDynamicProperty(turtleFilesProp, JSON.stringify(turtleFiles))
        }

        else if (command == "run") {
            const name = rest[0];
            const file = readFile(turtleFiles, currentPath, name) as File | FileError;
            if (file.type == "FileError") return world.sendMessage(file.error);

            // Execute the file
            const turtleInterpreter = new TurtleInterpreter(turtle);
            await turtleInterpreter.runScript(file.content)
        }

        else if (command == "inventory") {
            const inventory = turtle.getComponent("minecraft:inventory") as EntityInventoryComponent

            for (var i = 0; i < 16; i++) {
                const item = inventory.container.getItem(i)
                if (item == undefined) continue;
                world.sendMessage(`§7${i}.§r ${item.typeId} - ${item.amount}`)
            }

            e.cancel = true
        }

        else {
            world.sendMessage(`${command} is not a recognised command, use help for a list of commands`)
        }
    } catch (e) { console.warn(e); throw e }
})