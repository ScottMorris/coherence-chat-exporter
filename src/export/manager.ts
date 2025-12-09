import { Provider, Conversation } from '../providers/types.js';
import { ExportPipeline, ExportResult } from './pipeline.js';
import { MarkdownTransformer } from './transformer.js';
import { Organizer } from './organizer.js';
import { Writer } from './writer.js';
import { ConversationTagger } from '../tagging/classifier.js';

export interface ExportContext {
    provider: Provider;
    taggingEnabled: boolean;
    taggingThreshold: number;
    outputPath: string;
    onStatusUpdate?: (status: string) => void;
}

export class ExportManager {
    static async executeExport(
        data: any | Conversation[],
        context: ExportContext
    ): Promise<ExportResult[]> {
        const transformer = new MarkdownTransformer();
        const organizer = new Organizer(context.outputPath);
        const writer = new Writer();

        let tagger: ConversationTagger | undefined;
        if (context.taggingEnabled) {
            if (context.onStatusUpdate) context.onStatusUpdate('Loading AI Model...');
            tagger = new ConversationTagger();
            await tagger.initialize();
        }

        const pipeline = new ExportPipeline(
            context.provider,
            transformer,
            organizer,
            writer,
            tagger
        );

        if (context.onStatusUpdate) context.onStatusUpdate('Exporting...');

        const results = await pipeline.export(data, {
            enableTagging: context.taggingEnabled,
            tagThreshold: context.taggingThreshold
        });

        return results;
    }
}
