const http = require('http');
const url = 'http://localhost:4000/api/ticket-type/event/e77d9407-9300-4aa2-9f8a-9590cfb3dda8/count';
http.get(url, (res) => {
  console.log('statusCode', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('body:', data);
  });
}).on('error', (e) => {
  console.error('error', e.message);
  process.exit(1);
});
