import fs from 'fs';
import path from 'path';

export function csvApiPlugin() {
  return {
    name: 'csv-api',
    configureServer(server) {
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
              const searchResultsDir = path.join(process.cwd(), 'search-results');
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
    }
  };
}
