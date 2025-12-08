import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

export interface ExportData {
  conversations: any; // The parsed JSON content of conversations.json
  projects?: any; // The parsed JSON content of projects.json (optional)
}

export class InputResolver {
  async resolve(inputPath: string): Promise<ExportData> {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input path not found: ${inputPath}`);
    }

    const stats = fs.statSync(inputPath);

    if (stats.isDirectory()) {
      return this.resolveDirectory(inputPath);
    } else if (inputPath.toLowerCase().endsWith('.zip')) {
      return this.resolveZip(inputPath);
    } else if (inputPath.toLowerCase().endsWith('.json')) {
      return this.resolveFile(inputPath);
    } else {
      throw new Error('Unsupported input type. Please provide a directory, a .json file, or a .zip file.');
    }
  }

  private resolveDirectory(dirPath: string): ExportData {
    const convPath = path.join(dirPath, 'conversations.json');
    if (!fs.existsSync(convPath)) {
      throw new Error(`conversations.json not found in directory: ${dirPath}`);
    }

    const conversations = this.readJson(convPath);

    let projects;
    const projPath = path.join(dirPath, 'projects.json');
    if (fs.existsSync(projPath)) {
      projects = this.readJson(projPath);
    }

    return { conversations, projects };
  }

  private resolveFile(filePath: string): ExportData {
    // If user points directly to a JSON file, assume it is conversations.json
    // For Claude, this means projects might be missed unless they are in the same dir
    const conversations = this.readJson(filePath);

    let projects;
    const dir = path.dirname(filePath);
    const projPath = path.join(dir, 'projects.json');

    // Opportunistically check for projects.json next to the file
    if (fs.existsSync(projPath)) {
      projects = this.readJson(projPath);
    }

    return { conversations, projects };
  }

  private resolveZip(zipPath: string): ExportData {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    const convEntry = zipEntries.find(entry => entry.entryName.endsWith('conversations.json'));
    if (!convEntry) {
      throw new Error('conversations.json not found in zip archive');
    }

    const conversations = JSON.parse(convEntry.getData().toString('utf8'));

    let projects;
    const projEntry = zipEntries.find(entry => entry.entryName.endsWith('projects.json'));
    if (projEntry) {
      projects = JSON.parse(projEntry.getData().toString('utf8'));
    }

    return { conversations, projects };
  }

  private readJson(path: string): any {
    const content = fs.readFileSync(path, 'utf-8');
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`Failed to parse JSON at ${path}`);
    }
  }
}
