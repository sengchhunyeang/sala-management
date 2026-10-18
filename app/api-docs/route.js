// GET /api-docs: Swagger UI for /api/openapi. A route handler, so it renders outside the app Shell.
const V = '5.17.14';
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Students API · Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${V}/swagger-ui.css">
</head>
<body>
  <div id="swagger"></div>
  <script src="https://unpkg.com/swagger-ui-dist@${V}/swagger-ui-bundle.js"></script>
  <script>SwaggerUIBundle({ url: '/api/openapi', dom_id: '#swagger', deepLinking: true });</script>
</body>
</html>`;

export function GET(){
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
