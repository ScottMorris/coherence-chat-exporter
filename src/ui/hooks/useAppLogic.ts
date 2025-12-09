import { useState, useEffect } from 'react';
import { AppView, AppMode, MenuOption } from '../types.js';
import { Conversation } from '../../providers/types.js';
import { configManager } from '../../config-manager.js';

export const useAppLogic = () => {
    const [view, setView] = useState<AppView>(AppView.Menu);
    const [mode, setMode] = useState<AppMode>(AppMode.Export);
    const [providerName, setProviderName] = useState<'claude' | 'chatgpt' | null>(null);
    const [status, setStatus] = useState('');
    const [exportCount, setExportCount] = useState(0);
    const [loadedConversations, setLoadedConversations] = useState<Conversation[]>([]);
    const [selectedForExport, setSelectedForExport] = useState<Conversation[]>([]);

    useEffect(() => {
        configManager.loadConfig();
    }, []);

    const handleMenuSelect = (value: string) => {
        if (value === MenuOption.Exit) process.exit(0);
        if (value === MenuOption.Source) {
            setMode(AppMode.Export);
            setView(AppView.SelectProvider);
        }
        if (value === MenuOption.Browse) {
            setMode(AppMode.Browse);
            setView(AppView.SelectProvider);
        }
        if (value === MenuOption.Stats) {
            setMode(AppMode.Stats);
            setView(AppView.SelectProvider);
        }
        if (value === MenuOption.Tagging) setView(AppView.TaggingSetup);
        if (value === MenuOption.Settings) setView(AppView.Settings);
    };

    const handleProviderSelect = (provider: 'claude' | 'chatgpt') => {
        setProviderName(provider);
        setView(AppView.InputPath);
    };

    return {
        view, setView,
        mode, setMode,
        providerName, setProviderName,
        status, setStatus,
        exportCount, setExportCount,
        loadedConversations, setLoadedConversations,
        selectedForExport, setSelectedForExport,
        handleMenuSelect,
        handleProviderSelect
    };
};
