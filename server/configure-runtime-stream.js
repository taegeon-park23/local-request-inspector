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
  app.use(express.text({ type: '*/*' }));

  return {
    getEventClients: () => clients,
  };
}

module.exports = {
  configureRuntimeStream,
};
