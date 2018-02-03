var main = null;
exports.name = "static";

exports.init = function(mainApp) {
  main = mainApp;
  main.addGetEndpoint("/api/static/champions", getChampions);
  main.addGetEndpoint("/api/static/champions/:id", getChampionById)
  main.addGetEndpoint("/api/static/champions/by-name/:name", getChampionByName);
};

function getChampions(req, res, next, connection) {
  generateChampionResponse(connection.query("SELECT * FROM champions"), res, connection);
}

function getChampionById(req, res, next, connection) {
  var id = req.params.id;
  generateChampionResponse(connection.query("SELECT  * FROM champions WHERE id = ?", [id]), res, connection);
}
function getChampionByName(req, res,next, connection) {
  var name = req.params.name;
  generateChampionResponse(connection.query("SELECT * FROM champions where name = ?", [name]), res, connection);
}
function generateChampionResponse(query, res, connection) {
  query.then((result) => {
    var returnObjects = [];
    for (var i = 0; i < result.length; i++) {
      returnObjects.push({id: result[i].id, name: result[i].name, full: result[i].full, sprite: result[i].sprite});
    }
    if (result.length == 1) {
      returnObjects = returnObjects[0];
    }
    res.status(200).send(returnObjects);
  }).catch((err) => {
    main.logger.warn(err);
    res.status(500).send("Internal Server Error");
  }).then(() => {
    main.releaseConnection(connection);
  })
}
