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

export interface FileError {
    type: "FileError",
    error: string
}


export const textDirectory = (directory: Directory, depth: number = 0): string => {
    let text = `§3${directory.name}/§r`;
    
    for (var i = 0; i < directory.files.length; i++) {
        const dir = directory.files[i];
        const pipe = i == directory.files.length - 1 ? "└" : "├";
        
        if (dir.type == "Directory") {
            text += `\n${" ".repeat(depth)} ${pipe} ${textDirectory(dir, depth + 3)}`
        }

        else text += `\n${" ".repeat(depth)} ${pipe} ${directory.files[i].name}`
    }
    
    if (depth == 0) return `\n${text}`
    else return text;
}

export const resolvePath = (root: Directory, path: string[]): Directory | FileError => {
    var current: Directory = root;

    for (var i = 0; i < path.length; i++) {
        const newPath = current.files.find(file => file.name == path[i])
        if (newPath === undefined) return {type: "FileError", error: `Directory §3${current.name}§r does not contain §3${path[i]}§r`}
        if (newPath.type == "File") return {type: "FileError", error: `Path should not contain Files`}
        current = newPath as Directory;
    }

    return current;
}

export const makeDirectory = (root: Directory, path: string[], name: string): Directory | FileError => {
    let currentDir = root;
    for (const dirName of path) {
        const dir = currentDir.files.find(f => f.name === dirName && f.type === "Directory") as Directory;
        if (dir) currentDir = dir;
        else return {type: "FileError", error: `Directory '${dirName}' not found in '${currentDir.name}'` }
    }

    currentDir.files.push({type: "Directory", name, files: []});
    return currentDir;
}