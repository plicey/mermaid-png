#!/usr/bin/env node

/**
 * Mermaid to PNG Converter
 *
 * A Bun/Node.js script to convert Mermaid diagrams to PNG images.
 *
 * Installation:
 *   bun install
 *   # or
 *   npm install
 *
 * This will install both puppeteer and mermaid as local dependencies.
 *
 * Usage:
 *   bun mermaid-to-png.js <input.mmd> [output.png]
 *   # or
 *   node mermaid-to-png.js <input.mmd> [output.png]
 *
 * Examples:
 *   bun mermaid-to-png.js diagram.mmd diagram.png
 *   bun mermaid-to-png.js diagram.mmd  # outputs to diagram.png
 *   node mermaid-to-png.js diagram.mmd diagram.png
 *   node mermaid-to-png.js diagram.mmd  # outputs to diagram.png
 *
 * Or use programmatically:
 *   const { mermaidToPng } = require('./mermaid-to-png');
 *   await mermaidToPng('graph TD; A-->B;', 'output.png');
 */

const fs = require('fs');
const path = require('path');

// Check if dependencies are available
let puppeteer;
let mermaidJsPath;

try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.error('Error: puppeteer is not installed.');
  console.error('Please install dependencies with: bun install');
  console.error('Or with: npm install');
  process.exit(1);
}

// Check if mermaid is installed locally
try {
  mermaidJsPath = path.join(__dirname, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');
  if (!fs.existsSync(mermaidJsPath)) {
    throw new Error('mermaid.min.js not found');
  }
} catch (e) {
  console.error('Error: mermaid is not installed locally.');
  console.error('Please install dependencies with: bun install');
  console.error('Or with: npm install');
  process.exit(1);
}

/**
 * Convert Mermaid diagram code to PNG
 * @param {string} mermaidCode - The Mermaid diagram code
 * @param {string} outputPath - Path to save the PNG file
 * @param {object} options - Configuration options
 * @param {string} options.backgroundColor - Background color (default: white)
 * @param {string} options.theme - Mermaid theme: default, dark, forest, neutral (default: default)
 * @param {number} options.scale - Scale factor for higher resolution (default: 2)
 * @param {boolean} options.noSandbox - Disable Puppeteer sandbox (WARNING: reduces security, use only in trusted environments)
 */
async function mermaidToPng(mermaidCode, outputPath, options = {}) {
  const {
    backgroundColor = 'white',
    theme = 'default',
    scale = 2,
    noSandbox = false
  } = options;

  let browser;
  try {
    const launchOptions = {
      headless: 'new'
    };
    
    // Only disable sandbox if explicitly requested (e.g., for containerized environments)
    // WARNING: Disabling sandbox reduces security - only use in trusted environments
    if (noSandbox) {
      launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    }
    
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    
    // Set viewport (only scale matters, dimensions are auto-sized by SVG)
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: scale });

    // Read local mermaid.min.js and embed it inline
    const mermaidJs = fs.readFileSync(mermaidJsPath, 'utf-8');

    // HTML template with embedded local mermaid
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <script>${mermaidJs}</script>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background-color: ${backgroundColor};
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .mermaid {
            display: flex;
            justify-content: center;
          }
        </style>
      </head>
      <body>
        <div class="mermaid">
          ${mermaidCode}
        </div>
        <script>
          mermaid.initialize({
            startOnLoad: true,
            theme: '${theme}',
            securityLevel: 'strict'
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for mermaid to render
    await page.waitForFunction(() => {
      const mermaidDiv = document.querySelector('.mermaid');
      return mermaidDiv && mermaidDiv.querySelector('svg');
    }, { timeout: 30000 });

    // Get the SVG element
    const svgElement = await page.$('.mermaid');
    
    // Take screenshot of the SVG
    const pngBuffer = await svgElement.screenshot({
      type: 'png',
      omitBackground: backgroundColor === 'transparent'
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (outputDir && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the PNG file
    fs.writeFileSync(outputPath, pngBuffer);
    
    return outputPath;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Convert Mermaid file to PNG
 * @param {string} inputPath - Path to .mmd file
 * @param {string} outputPath - Path to save PNG (optional)
 * @param {object} options - Configuration options
 */
async function convertFile(inputPath, outputPath = null, options = {}) {
  // Read mermaid code from file
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const mermaidCode = fs.readFileSync(inputPath, 'utf-8');
  
  // Generate output path if not provided
  if (!outputPath) {
    const ext = path.extname(inputPath);
    outputPath = inputPath.replace(ext, '.png');
  }

  return await mermaidToPng(mermaidCode, outputPath, options);
}

/**
 * Batch convert multiple Mermaid files
 * @param {string[]} inputPaths - Array of .mmd file paths
 * @param {string} outputDir - Directory to save PNG files
 * @param {object} options - Configuration options
 */
async function batchConvert(inputPaths, outputDir, options = {}) {
  const results = [];
  
  for (const inputPath of inputPaths) {
    try {
      const outputPath = path.join(outputDir, path.basename(inputPath, path.extname(inputPath)) + '.png');
      await convertFile(inputPath, outputPath, options);
      results.push({ input: inputPath, output: outputPath, success: true });
    } catch (error) {
      results.push({ input: inputPath, error: error.message, success: false });
    }
  }
  
  return results;
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Mermaid to PNG Converter
=======================

Installation:
  bun install
  # or
  npm install

Usage:
  mmdpng <input.mmd> [output.png] [options]

Options:
  --theme <theme>       Mermaid theme: default, dark, forest, neutral
  --scale <factor>      Scale factor for resolution (default: 2)
  --bg <color>          Background color (default: white)
  --no-sandbox          Disable browser sandbox (WARNING: reduces security)

Examples:
  mmdpng diagram.mmd
  mmdpng diagram.mmd output.png
  mmdpng diagram.mmd output.png --theme dark --scale 3
`);
    process.exit(0);
  }

  const inputPath = args[0];
  let outputPath = null;
  const options = {};

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--theme' && args[i + 1]) {
      options.theme = args[++i];
    } else if (args[i] === '--scale' && args[i + 1]) {
      options.scale = parseInt(args[++i], 10);
    } else if (args[i] === '--bg' && args[i + 1]) {
      options.backgroundColor = args[++i];
    } else if (args[i] === '--no-sandbox') {
      options.noSandbox = true;
    } else if (!args[i].startsWith('--')) {
      outputPath = args[i];
    }
  }

  try {
    const result = await convertFile(inputPath, outputPath, options);
    console.log(`✓ Successfully converted: ${result}`);
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = {
  mermaidToPng,
  convertFile,
  batchConvert
};

// Run CLI if executed directly
if (require.main === module) {
  main();
}
