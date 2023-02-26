export interface Directory {
    name: string
    type: "Directory"
    files: (Directory | File)[]
}

export interface File {
    name: string
    type: "File"
    content: string
}

export const textDirectory = (directory: Directory): string => {
    let text = `\n${directory.name}`;

    for (var i = 0; i < directory.files.length; i++) {
        const pipe = i == directory.files.length - 1 ? "└" : "├";
        const color = directory.files[i].type == "File" ? "§7" : ""
        text += `\n ${pipe} ${color}${directory.files[i].name}§r`
    }

    return text;
}

export const resolvePath = (root: Directory, path: string[]): Directory => {
    var current: Directory = root;

    for (var i = 0; i < path.length; i++) {
        const newPath = current.files.find(file => file.name == path[i])
        if (newPath === undefined) throw new Error(`${current.name} does not contain ${path[i]}`);
        if (newPath.type == "File") throw new Error("Path should not contain Files");
        current = newPath as Directory;
    }

    return current;
}