const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

/**
 * HTTP request handler function that processes incoming requests and generates responses.
 * This callback function is invoked for every HTTP request received by the server,
 * providing a basic "Hello, World!" response for all requests regardless of method or path.
 * The function sets appropriate HTTP headers and status codes for successful responses.
 * 
 * @param {http.IncomingMessage} req - The HTTP request object containing request details such as method, URL, headers, and body data
 * @param {http.ServerResponse} res - The HTTP response object used to send response data back to the client, including status codes, headers, and body content
 * @returns {void} This function does not return a value; it operates through side effects on the response object
 */
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});

/**
 * Server startup callback function that executes when the HTTP server successfully binds to the specified port and hostname.
 * This callback provides confirmation that the server initialization completed successfully and displays
 * the server access URL for development purposes. The console output serves as a development tool
 * to verify server availability and provide the correct localhost URL for testing and development workflows.
 * 
 * @returns {void} This function does not return a value; it performs logging operations as a side effect
 */
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
