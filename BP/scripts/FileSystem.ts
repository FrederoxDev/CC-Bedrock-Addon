export interface Directory {
    name: string
    type: "Directory"
    directories: Directory[]
    files: File[]
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

console.warn = console.log

export const directoryTree = (directory: Directory, depth: number = 0): string => {
    let text = `§3${directory.name}/§r`;

    for (var i = 0; i < directory.directories.length; i++) {
        const dir = directory.directories[i];
        const pipe = (i == directory.directories.length - 1 && directory.files.length == 0) ? "└" : "├";
        text += `\n${" │ ".repeat(depth)} ${pipe} ${directoryTree(dir, depth + 1)}`
    }
    
    for (var i = 0; i < directory.files.length; i++) {
        const pipe = i == directory.files.length - 1 ? "└" : "├";
        text += `\n${" │ ".repeat(depth)} ${pipe} ${directory.files[i].name}`
    }
    
    if (depth == 0) return `\n${text}`
    else return text;
}

export const resolveDirectory = (root: Directory, path: string[]): Directory | FileError => {
    var current: Directory = root;

    for (var i = 0; i < path.length; i++) {
        const newPath = current.directories.find(dir => dir.name == path[i])
        if (newPath === undefined) return {type: "FileError", error: `Directory §3${current.name}§r does not contain §3${path[i]}§r`}
        current = newPath;
    }

    return current;
}

export const makeDirectory = (dir: Directory, path: string[], dirName: string): Directory | FileError => {
    if (path.length > 0) {
        const index = dir.directories.findIndex(f => f.name == path.shift());
        const result = makeDirectory(dir.directories[index], path, dirName)
        if (result.type == "FileError") return result;
        dir.directories[index] = result;
    }

    // Check it doesnt already exist
    if (dir.directories.find(f => f.name == dirName)) return { type: "FileError", error: `${dirName} already exists!` };

    // Create the new directory and return an instance
    dir.directories.push({
        type: "Directory", 
        name: dirName, 
        files: [],
        directories: []
    });
    return dir;
}

export const makeFile = (dir: Directory, path: string[], fileName: string): Directory | FileError => {
    if (path.length > 0) {
        const index = dir.directories.findIndex(f => f.name == path.shift());
        const result = makeDirectory(dir.directories[index], path, fileName)
        if (result.type == "FileError") return result;
        dir.directories[index] = result;
    }

    // Check it doesnt already exist
    if (dir.files.find(f => f.name == fileName)) return { type: "FileError", error: `${fileName} already exists!` };

    // Create the new directory and return an instance
    dir.files.push({
        type: "File", 
        name: fileName,
        content: ""
    });
    return dir;
}