import fs from 'node:fs';
import { PDFParse } from 'pdf-parse';

const data = fs.readFileSync('./Michaelides, Alex - The Silent Patient - libgen.li.pdf');

const parser = new PDFParse({ data });
const result = await parser.getText();

console.log(result.text);
