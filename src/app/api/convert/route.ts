import JSZip from 'jszip';
import { NextResponse, NextRequest } from 'next/server';

export const runtime = 'nodejs';

const opencc = require('node-opencc');
const targetExtensions = ['htm', 'html', 'xhtml', 'ncx', 'opf'];

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // Parse the incoming multipart form data.
        const formData: FormData = await req.formData();
        // Support multiple file uploads. The field name is "file".
        const uploadedFiles: File[] = formData.getAll('file') as File[];
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return NextResponse.json(
                { error: 'No file uploaded.' },
                { status: 400 }
            );
        }

        // Create an outer zip that will contain all the converted EPUB files.
        const outerZip = new JSZip();

        // Process each uploaded EPUB file concurrently.
        await Promise.all(
            uploadedFiles.map(async (uploadedFile) => {
                // Convert the uploaded file (a Blob) to a Node.js Buffer.
                const arrayBuffer: ArrayBuffer = await uploadedFile.arrayBuffer();
                const fileBuffer: Buffer = Buffer.from(arrayBuffer);

                // Load the EPUB as a ZIP archive.
                const zip: JSZip = await JSZip.loadAsync(fileBuffer);
                const outputZip: JSZip = new JSZip();

                // Process each file in the EPUB.
                const fileNames: string[] = Object.keys(zip.files);
                await Promise.all(
                    fileNames.map(async (filename: string): Promise<void> => {
                        const zipEntry: JSZip.JSZipObject = zip.files[filename];
                        // Convert the filename from Simplified Chinese to Taiwanese.
                        const newFilename: string = opencc.simplifiedToTaiwan(filename);

                        if (!zipEntry.dir) {
                            // Determine the file extension.
                            const ext: string = (filename.split('.').pop() as string).toLowerCase();
                            if (targetExtensions.includes(ext)) {
                                // Read target file as text.
                                const content: string = await zipEntry.async('text');
                                let tcContent: string = convertContent(content);
                                // Special case for .opf files: replace language tag.
                                if (ext === 'opf') {
                                    tcContent = tcContent.replace(
                                        '<dc:language>zh-CN</dc:language>',
                                        '<dc:language>zh-TW</dc:language>'
                                    );
                                }
                                outputZip.file(newFilename, tcContent);
                            } else {
                                // For non-target files, copy as binary.
                                const content: Buffer = await zipEntry.async('nodebuffer');
                                outputZip.file(newFilename, content, { binary: true });
                            }
                        } else {
                            // Create folders in the output ZIP.
                            // JSZip handles nested folders when file paths include '/'
                            outputZip.folder(newFilename);
                        }
                    })
                );

                // Generate the converted EPUB as a Node.js Buffer with compression.
                const outputBuffer: Buffer = await outputZip.generateAsync({
                    type: 'nodebuffer',
                    compression: 'DEFLATE',
                });
                // Determine an output filename (append "-converted.epub" if needed).
                const originalBaseName = uploadedFile.name.replace(/\.epub$/i, '');
                const translatedBaseName = opencc.simplifiedToTaiwan(originalBaseName);
                const outputFileName = `${translatedBaseName}-converted.epub`;
                // Add the converted EPUB to the outer zip.
                outerZip.file(outputFileName, outputBuffer, { binary: true });
            })
        );

        // Generate the final ZIP containing all converted EPUBs with compression.
        const outerBuffer: Buffer = await outerZip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        // Return the ZIP for download.
        return new NextResponse(outerBuffer, {
            headers: {
                'Content-Disposition': 'attachment; filename="converted-files.zip"',
                'Content-Type': 'application/zip',
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'An error occurred during conversion.' },
            { status: 500 }
        );
    }
}

/**
 * Convert content using node-opencc's synchronous function over the entire text.
 * @param content - The original file content.
 * @returns The converted content.
 */
function convertContent(content: string): string {
    return opencc.simplifiedToTaiwan(content);
}
