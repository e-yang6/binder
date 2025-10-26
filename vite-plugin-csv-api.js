import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export function csvApiPlugin() {
  return {
    name: 'csv-api',
    configureServer(server) {
      // Handle /api/create-csv endpoint
      server.middlewares.use('/api/create-csv', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { filename, content } = JSON.parse(body);
              
              // Create search-results directory if it doesn't exist
              const searchResultsDir = path.join(process.cwd(), 'public');
              if (!fs.existsSync(searchResultsDir)) {
                fs.mkdirSync(searchResultsDir, { recursive: true });
              }
              
              const filePath = path.join(searchResultsDir, filename);
              fs.writeFileSync(filePath, content);
              
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                message: `CSV file created: ${filename}`,
                path: filePath
              }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
              }));
            }
          });
        } else {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Method not allowed' 
          }));
        }
      });

      // Handle /api/scrape endpoint
      server.middlewares.use('/api/scrape', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const { searchTerm } = JSON.parse(body);
              
              if (!searchTerm) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: false, 
                  error: 'Search term is required' 
                }));
                return;
              }

              console.log(`Starting Kijiji scraper for: ${searchTerm}`);
              
              // Run the Python scraper
              const scraperPath = path.join(process.cwd(), 'kijiji-scraper', 'kijiji_scraper.py');
              const pythonProcess = spawn('python', [scraperPath, searchTerm], {
                cwd: path.join(process.cwd(), 'kijiji-scraper')
              });

              let output = '';
              let errorOutput = '';

              pythonProcess.stdout.on('data', (data) => {
                const message = data.toString();
                console.log(`Scraper: ${message}`);
                output += message;
              });

              pythonProcess.stderr.on('data', (data) => {
                const message = data.toString();
                console.error(`Scraper Error: ${message}`);
                errorOutput += message;
              });

              pythonProcess.on('close', (code) => {
                if (code === 0) {
                  const csvFilename = `${searchTerm}.csv`;
                  const csvPath = path.join(process.cwd(), 'public', csvFilename);
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: true,
                    message: `Scraping completed for ${searchTerm}`,
                    filename: csvFilename,
                    output: output
                  }));
                } else {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    error: `Scraper exited with code ${code}`,
                    output: output,
                    errorOutput: errorOutput
                  }));
                }
              });

              pythonProcess.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: `Failed to start scraper: ${error.message}`
                }));
              });

            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
              }));
            }
          });
        } else {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Method not allowed' 
          }));
        }
      });
    }
  };
}
