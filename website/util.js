exports.createEndpointFromFunc = (func, logger) => {
  return (req, res, next) => {
    func().then((result) => {
      res.status(200).send(result);
    }).catch((err) => {
      logger.warn(err);
      res.status(500).send(err);
    });
  }
}
