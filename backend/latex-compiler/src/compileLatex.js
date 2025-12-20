import fs from 'fs';
import path from "path";
import { exec } from 'child_process';
import util from "util";
import os from 'os';

const execPromise = util.promisify(exec);

export async function compileLatexToPdf(textContent, outputName = "resume"){
    // creting a unique temporary file
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(),"latex-"));
    const texPath = path.join(tempDir,`${outputName}.tex`);
    const pdfPath = path.join(tempDir, `${outputName}.pdf`);
    // fs.writeFileSync(`${outputName}.tex`,textContent);
    fs.writeFileSync(texPath, textContent);
    try{
        await execPromise(`tectonic ${texPath} --keep-intermediates`,{cwd: tempDir});
        
        const pdfBuffer = fs.readFileSync(pdfPath);

        fs.rmSync(tempDir, {recursive: true, force: true});

        return pdfBuffer;

    } catch(error){
        fs.rmSync(tempDir, {recursive: true, force: true});
        console.error("LaTeX Compilation Error:", error);
        throw new Error("Failed to compile LaTeX to PDF");
    }
}