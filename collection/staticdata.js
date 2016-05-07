var logger = null;
var connection = null;
var League = null;

exports.init = function(con, log, leag) {
  logger = log;
  connection = con;
  League = leag;
}

exports.start = () => {
  initChampions();
  // check champs daily.
  setInterval(() => {
    initChampions();
  }, 24*60*60*1000);
}
function initChampions() {
  return League.Static.getChampionList({champData: "image"}).then((result) => {
    var promises = [];
    for (var champ in result.data) {
      var currentChamp = result.data[champ];
      var promise = connection.query("INSERT IGNORE INTO champions (id, name, full, sprite) values (?, ?, ?, ?)", [currentChamp.id, currentChamp.name, currentChamp.image.full, currentChamp.image.sprite]);
      promises.push(promise);
    }
    return Promise.all(promises);
  }).catch((err) => {
    logger.info("Error: " + err);
  })
}
