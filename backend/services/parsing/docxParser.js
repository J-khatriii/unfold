import mammoth from "mammoth";
import * as cheerio from "cheerio";

const docxParse = async (buffer) => {
    const { value : html } = await mammoth.convertToHtml({ buffer });
    const $ = cheerio.load(html);

    const sections = [];
    let currentTitle = null;
    let currentContent = [];
    let orderIndex = 0;

    const flush = () => {             
        if (currentTitle !== null) {
            sections.push({
                title: currentTitle,
                content: currentContent.join(""),
                order_index: orderIndex++,
            });
        }
    }

    $("body").children().each((_, el) => {
        const tag = el.tagName;
        if (tag === "h1" || tag === "h2") {
            flush();
            currentTitle = $(el).text().trim();
            currentContent = [];
        } else {
            currentContent.push($.html(el));
        }
    });

    flush();

    // Fallback: no headings found at all, treat whole doc as one section
    if (sections.length === 0) {
        return [{ title: "Full document", content: html, order_index: 0 }];
    }

    return sections;
}

export default docxParse;
