import { runScript } from "./run";
import { world } from "@minecraft/server"

console.log = console.warn

var file = [
    "log(Turtle::InspectDown());", "Turtle::Forward();",
    "log(Turtle::InspectDown());", "Turtle::Forward();",
    "log(Turtle::InspectDown());", "Turtle::Forward();",
    "log(Turtle::InspectDown());", "Turtle::Forward();",
    "log(Turtle::InspectDown());"
]

world.events.beforeChat.subscribe(async e => {
    var [command, ...rest] = e.message.split(" ");
    e.targets = [e.sender]

    if (command === "open") {
        e.message = `${rest[0]} is now open`
    }

    if (command === "read") {
        var out = "Reading main.cos"
        file.forEach((line, idx) => {
            out += `\n§7${idx + 1} |§r ${line}`
        })

        e.message = out
    }

    if (command === "edit") {
        const line = parseInt(rest.shift()) - 1;
        const newText = rest.join(" ");

        e.message = `§7${line + 1} |§r ${newText}`
        file[line] = newText
    }

    if (command === "run") {
        world.say("Running main.cos")
        e.cancel = true;
        await runScript(e, file.join("\n"));
    }
})