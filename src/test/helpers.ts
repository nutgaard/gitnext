import os from 'os';
import path from 'path';
import fs from 'fs';
import {guid} from "../server/utils";

function joinTaggedTemplate(pieceOrPieces: string | TemplateStringsArray, ...substitutes: string[]): string {
    const pieces = Array.isArray(pieceOrPieces) ? pieceOrPieces : [pieceOrPieces];
    let result: string = pieces[0];
    for (let i = 0; i < substitutes.length; i++) {
        result += substitutes[i] + pieces[i + 1];
    }
    return result;
}

export function trimIndent(pieces: string | TemplateStringsArray, ...substitues: string[]): string {
    const value = joinTaggedTemplate(pieces, ...substitues);
    const lines = value.split('\n');
    const lines_to_consider = lines
        .filter((content, index) => {
            if (content.trim() === '') {
                return !(index === 0 || index === lines.length - 1);
            } else {
                return true;
            }
        });
    const minimal_prefix = lines_to_consider
        .map((line) => {
            const trimmed = line.trimStart();
            return line.length - trimmed.length;
        })
        .reduce((a, b) => Math.min(a, b), Number.MAX_SAFE_INTEGER);
    return lines_to_consider
        .map((line) => line.substr(minimal_prefix))
        .join('\n');
}

export function yaml(pieces: string | TemplateStringsArray, ...substitutes: string[]): string {
    return trimIndent(pieces, ...substitutes);
}

export function yamlFile(pieces: string | TemplateStringsArray, ...substitutes: string[]): string {
    const content = yaml(pieces, ...substitutes);
    return writeTmpFile('file.yaml', content);
}

const TMP_PREFIX = 'gitnext-';
const TMP_SUFFIX = '.tmp';

export function createTmpFile(name: string): string {
    return path.join(os.tmpdir(), `${TMP_PREFIX}${guid()}-${name}${TMP_SUFFIX}`);
}

export function deleteTmpFiles() {
    const dir = os.tmpdir();
    fs.readdirSync(dir)
        .filter((file) => file.startsWith(TMP_PREFIX) && file.endsWith(TMP_SUFFIX))
        .forEach((file) => fs.unlinkSync(path.join(dir, file)));
}

export function writeTmpFile(file: string, content: string): string {
    const filename = createTmpFile(file);
    fs.writeFileSync(filename, content, 'utf8');
    return filename;
}