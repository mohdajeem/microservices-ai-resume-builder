import express from 'express';
import morgan from 'morgan';
import { compileLatexToPdf } from "./src/compileLatex.js";

const app = express();

app.use(express.json({limit: "10mb"}));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
    res.json({status: "ok"});
});

app.post("/compile",async (req, res) => {
    try{
        const {tex, outputName} = req.body;

        if(!tex){
            return res.status(400).json({error: "Missing 'tex' input."});
        }

        const pdf = await compileLatexToPdf(tex, outputName || "resume");
        res.setHeader("Content-Type","application/pdf");
        res.send(pdf);
    } catch(error){
        console.error("Compile Error: ",error);
        res.status(500).json({error: "Failed to compile PDF."});
    }
});
const PORT = process.env.PORT || 6000;


app.listen(PORT, () => {
  console.log(`LaTeX Compiler Microservice running on port ${PORT}`)
})