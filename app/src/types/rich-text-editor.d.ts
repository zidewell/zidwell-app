declare module '@lakshaykumar/rich-text-editor' {
  export interface RichTextEditorOptions {
    placeholder?: string;
    enableAutoSave?: boolean;
    autoSaveKey?: string | null;
    customButtons?: Array<{
      label: string;
      title?: string;
      command: string;
      action: (editor: any) => void;
    }>;
    contextMenuItems?: Array<{
      label?: string;
      icon?: string;
      type?: 'divider';
      action?: (editor: any) => void;
    }>;
  }

  export default class RichTextEditor {
    constructor(element: string | HTMLElement, options?: RichTextEditorOptions);
    
    getHTML(minify?: boolean): string;
    setHTML(html: string): void;
    clear(): void;
    handleCommand(cmd: string, value?: any): void;
    updateStats(): void;
    registerCommand(name: string, callback: (editor: any) => void): void;
    destroy?(): void;
  }
}