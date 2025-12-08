import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ClaudeProvider } from '../src/providers/claude.js';
import { ChatGPTProvider } from '../src/providers/chatgpt.js';
import { MarkdownTransformer } from '../src/export/transformer.js';
import { Provider } from '../src/providers/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplesDir = path.resolve(__dirname, '../samples');

async function generateSamples() {
    console.log('Generating samples...');

    await processProvider('claude', new ClaudeProvider());
    await processProvider('chatgpt', new ChatGPTProvider());

    console.log('Done!');
}

async function processProvider(providerName: string, provider: Provider) {
    const inputPath = path.join(samplesDir, providerName, 'mock_conversations.json');
    const outputDir = path.join(samplesDir, providerName, 'output');

    if (!fs.existsSync(inputPath)) {
        console.warn(`Input file not found: ${inputPath}`);
        return;
    }

    // Clean output dir
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`Processing ${providerName}...`);
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const json = JSON.parse(rawData);

    const conversations = await provider.normalize(json);
    const transformer = new MarkdownTransformer();

    for (const conv of conversations) {
        const markdown = transformer.toMarkdown(conv);

        // Generate filename similar to the main app logic if possible,
        // or just use title for simplicity in samples.
        // The main app uses a specific slug format.
        // For samples, let's try to mimic a basic structure: YYYY/MM-month/DD-slug.md

        const date = conv.created_at;
        const year = date.getFullYear().toString();
        const monthName = date.toLocaleString('default', { month: 'long' }).toLowerCase();
        const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const slug = conv.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const fileDir = path.join(outputDir, year, `${monthNum}-${monthName}`);
        fs.mkdirSync(fileDir, { recursive: true });

        const filename = `${day}-${slug}.md`;
        const filePath = path.join(fileDir, filename);

        fs.writeFileSync(filePath, markdown);
        console.log(`Generated ${filePath}`);
    }
}

generateSamples().catch(console.error);
