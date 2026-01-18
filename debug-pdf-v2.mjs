import { getDocument } from 'pdfjs-dist';
import fs from 'fs/promises';

const run = async () => {
    try {
        console.log("Reading file...");
        const buffer = await fs.readFile('/Users/manideep/Desktop/website/lms-app/QUIZ.pdf');

        console.log("Parsing PDF...");
        const loadingTask = getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
        });

        const pdf = await loadingTask.promise;
        console.log(`PDF loaded. Pages: ${pdf.numPages}`);

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        console.log('--- RAW TEXT ---');
        console.log(fullText);
        console.log('--- END RAW TEXT ---');
    } catch (error) {
        console.error("Error:", error);
    }
};

run();
