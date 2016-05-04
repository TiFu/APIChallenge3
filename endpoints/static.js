var main = null;

exports.init = function(mainApp) {
  main = mainApp;

  initChampions();
  main.addEndpoint("/api/static/champions", getChampions);
  main.addEndpoint("/api/static/champions/:id", getChampionById)
};

function getChampions(req, res, next) {
  generateChampionResponse(main.database.query("SELECT * FROM champions"), res);
}

function getChampionById(req, res, next) {
  var id = req.params.id;
  generateChampionResponse(main.database.query("SELECT  * FROM champions WHERE id = ?", [id]), res);
}

function generateChampionResponse(query, res) {
  query.then((result) => {
    var returnObjects = [];
    for (var i = 0; i < result.length; i++) {
      returnObjects.push({id: result[i].id, name: result[i].name, full: result[i].full, sprite: result[i].sprite});
    }
    res.status(200).send(returnObjects);
  }).catch((err) => {
    main.logger.warn("ERROR", err);
    res.status(500).send("Internal Server Error");
  })
}
