import fs from 'fs';
import path from "path";
import { exec } from 'child_process';
import util from "util";
import os from 'os';
import crypto from 'crypto';

const execPromise = util.promisify(exec);

// Path to the shared volume mount for persistent persistence
const RENDERS_DIR = path.join(process.cwd(), 'renders');

// Ensure the renders directory exists (in case it's not mounted yet)
if (!fs.existsSync(RENDERS_DIR)) {
    fs.mkdirSync(RENDERS_DIR, { recursive: true });
}

export async function compileLatexToPdf(textContent, outputName = "resume", targetHash = null) {
    // 1. If no targetHash is provided, generate a fallback (though generator should pass one)
    const contentHash = targetHash || crypto.createHash('sha256').update(textContent).digest('hex');
    const persistentPdfPath = path.join(RENDERS_DIR, `${contentHash}.pdf`);

    // 2. Check Shared Volume for existing PDF
    if (fs.existsSync(persistentPdfPath)) {
        console.log(`[LATEX-COMPILER] 🚀 Persistent Cache Hit! Serving PDF: ${contentHash}.pdf`);
        return fs.readFileSync(persistentPdfPath);
    }

    console.log(`[LATEX-COMPILER] 🛠️ Persistent Cache Miss. Compiling with Tectonic (Hash: ${contentHash})`);

    // creting a unique temporary file
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(),"latex-"));
    const texPath = path.join(tempDir,`${outputName}.tex`);
    const pdfPath = path.join(tempDir, `${outputName}.pdf`);
    // fs.writeFileSync(`${outputName}.tex`,textContent);
    fs.writeFileSync(texPath, textContent);
    try {
        await execPromise(`tectonic ${texPath} --keep-intermediates`, { cwd: tempDir });

        const pdfBuffer = fs.readFileSync(pdfPath);

        // 4. Save to Persistent Volume
        fs.writeFileSync(persistentPdfPath, pdfBuffer);
        console.log(`[LATEX-COMPILER] ✅ PDF saved to persistent shared volume: ${contentHash}.pdf`);

        // 5. Cleanup temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });

        return pdfBuffer;

    } catch (error) {
        fs.rmSync(tempDir, {recursive: true, force: true});
        console.error("LaTeX Compilation Error:", error);
        throw new Error("Failed to compile LaTeX to PDF");
    }
}