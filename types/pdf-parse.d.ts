// types/pdf-parse.d.ts
declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: any;
  }
  
  function pdfParse(data: Buffer, options?: any): Promise<PDFData>;
  export default pdfParse;
}