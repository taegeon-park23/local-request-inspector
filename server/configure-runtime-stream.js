function configureRuntimeStream(app, express) {
  let clients = [];

  app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    clients.push(res);
    req.on('close', () => {
      clients = clients.filter((client) => client !== res);
    });
  });

  const captureRawBody = (req, res, buf) => {
    req.rawBody = buf.toString();
  };

  app.use(express.json({ verify: captureRawBody }));
  app.use(express.urlencoded({ extended: true, verify: captureRawBody }));
  app.use(express.text({
    type: (req) => {
      const contentType = String(req.headers['content-type'] || '').toLowerCase();

      if (contentType.includes('multipart/form-data')) {
        return false;
      }

      if (contentType.includes('application/json') || contentType.includes('application/x-www-form-urlencoded')) {
        return false;
      }

      return true;
    },
    verify: captureRawBody,
  }));

  return {
    getEventClients: () => clients,
  };
}

module.exports = {
  configureRuntimeStream,
};
