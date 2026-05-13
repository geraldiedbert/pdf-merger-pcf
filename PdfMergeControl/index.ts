import { PDFDocument } from 'pdf-lib';

export class PdfMergeControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container: HTMLDivElement;
  private notifyOutputChanged: () => void;
  private mergedPdfBase64: string = '';

  public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;
    this.render(context);
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this.render(context);
  }

  private async render(context: ComponentFramework.Context<IInputs>): Promise<void> {
    const pdf1 = context.parameters.FirstPdf?.raw || '';
    const pdf2 = context.parameters.SecondPdf?.raw || '';

    if (pdf1 && pdf2) {
      await this.mergePdfs(pdf1, pdf2);
    }
  }

  private async mergePdfs(base64Pdf1: string, base64Pdf2: string): Promise<void> {
    try {
      const bytes1 = Uint8Array.from(atob(base64Pdf1), c => c.charCodeAt(0));
      const bytes2 = Uint8Array.from(atob(base64Pdf2), c => c.charCodeAt(0));

      const doc1 = await PDFDocument.load(bytes1);
      const doc2 = await PDFDocument.load(bytes2);

      const pages = await doc1.copyPages(doc2, doc2.getPageIndices());
      pages.forEach(p => doc1.addPage(p));

      const mergedBytes = await doc1.save();
      const base64 = btoa(String.fromCharCode(...mergedBytes));

      this.mergedPdfBase64 = base64;
      this.notifyOutputChanged();

      // trigger download
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
    } catch (e) {
      console.error('PDF merge failed:', e);
    }
  }

  public getOutputs(): IOutputs {
    return { MergedPdf: this.mergedPdfBase64 };
  }

  public destroy(): void {}
}

interface IInputs {
  FirstPdf: ComponentFramework.PropertyTypes.StringProperty;
  SecondPdf: ComponentFramework.PropertyTypes.StringProperty;
}

interface IOutputs {
  MergedPdf?: string;
}