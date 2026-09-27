import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFile } from "node:fs/promises";
import { GettingStartedSheet } from "../src/components/getting-started-sheet.tsx";

// One source of wording for the screen, printable HTML and downloadable PDF.
const css = `
@font-face{font-family:Atkinson;src:url(/fonts/atkinson-hyperlegible-d64ba838ef.woff2)}
@font-face{font-family:Atkinson;font-weight:700;src:url(/fonts/atkinson-hyperlegible-140e2bd25a.woff2)}
@font-face{font-family:SourceSerif;src:url(/fonts/source-serif-4-f2ea9c12d2.woff2)}
*{box-sizing:border-box}body{margin:0;padding:24px;background:#e7ddce;color:#2a241c;font-family:Atkinson,system-ui,sans-serif;line-height:1.45}
.start-sheet{max-width:800px;margin:auto;padding:36px;background:#fff;border-radius:12px}
h1,h2{font-family:SourceSerif,Georgia,serif;line-height:1.2}h1{font-size:38px;margin:10px 0}h2{font-size:23px;margin:0 0 10px}
p{margin:10px 0}.start-kicker,.start-label{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#183e35}
.start-address{background:#f6f0e5;padding:14px 20px;margin:20px 0}.start-split{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:22px 0}
ol{list-style:none;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}ol li{display:flex;gap:12px}ol li>span{font-family:SourceSerif,Georgia,serif;font-size:24px;line-height:1.1;color:#183e35}
.start-foot{border-top:1px solid #cdbc9e;padding-top:18px}ul{padding-left:20px}ul li{margin:8px 0}.start-call{font-size:14px;margin-top:18px;color:#5e564c}
@media(max-width:560px){body{padding:12px}.start-sheet{padding:22px 18px}h1{font-size:30px}ol,.start-split{grid-template-columns:1fr}}
@page{size:letter;margin:.48in}@media print{body{padding:0;background:white;font-size:10.3pt;line-height:1.32}.start-sheet{max-width:none;padding:0;border-radius:0}h1{font-size:26pt}h2{font-size:15pt}.start-kicker,.start-label{font-size:8pt}.start-address{margin:12px 0;padding:8px 12px}.start-split{gap:22px;margin:14px 0}ol{gap:12px 20px}.start-foot{padding-top:12px}.start-call{font-size:9pt;margin:12px 0 0}li,section{break-inside:avoid}}
`;
await writeFile(
  "public/getting-started.html",
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Ghostwriter - Getting started</title><style>' +
    css +
    "</style></head><body>" +
    renderToStaticMarkup(React.createElement(GettingStartedSheet)) +
    "</body></html>\n",
);
