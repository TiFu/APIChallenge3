var main = null;

exports.init = function(mainApp) {
  main = mainApp;

  initChampions();
  main.addEndpoint("/api/static/champions", getChampions);
  main.addEndpoint("/api/static/champions/:id", getChampionById)
  // check champs daily.
  setInterval(() => {
    initChampions();
  }, 24*60*60*1000);
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

function initChampions() {
  return main.League.Static.getChampionList({champData: "image"}).then((result) => {
    var promises = [];
    for (var champ in result.data) {
      var currentChamp = result.data[champ];
      var promise = main.database.query("INSERT IGNORE INTO champions (id, name, full, sprite) values (?, ?, ?, ?)", [currentChamp.id, currentChamp.name, currentChamp.image.full, currentChamp.image.sprite]);
      promises.push(promise);
    }
    return Promise.all(promises);
  }).catch((err) => {
    main.logger.info("Error: " + err);
  })
}
