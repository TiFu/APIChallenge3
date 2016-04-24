var util = require("../util");
var mainApp;
var cpuInfo;
var cpuInfoInterval;
var cpuLoadInterval;

exports.name = "CPU Information";
exports.description = "This module provides access to CPU information and CPU workload";
exports.reason = undefined;
exports.init = (main) => {
  mainApp = main;
  recordCPULoad();
  mainApp.addAPIEndpoint("/cpu/info", util.createEndpointFromFunc(generateCPUInfo, mainApp.logger));
  mainApp.addAPIEndpoint("/cpu/load", util.createEndpointFromFunc(getCPULoad, mainApp.logger));

  return createCPUTable().then((result) => {
    return generateCPUInfo();
  }).then(() => {
    cpuInfoInterval = setInterval(() => generateCPUInfo().then((result) => {
      cpuInfo = result;
    }), mainApp.config.get("updateTimeLong"));
    cpuLoadInterval = setInterval(recordCPULoad, mainApp.config.get("updateTimeShort"));
    return true;
  }).catch((err) => {
    reason = err;
    return false;
  });
}


function createCPUTable() {
  return mainApp.database.query("CREATE TABLE IF NOT EXISTS " + mainApp.config.get("database.tables.cpu") + " (id INTEGER NOT NULL AUTO_INCREMENT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, cpu_type ENUM('ALL', 'SINGLE'), cpu_id INT, user DECIMAL(5,2), nice DECIMAL(5,2), system DECIMAL(5,2), iowait DECIMAL(5,2), irq DECIMAL(5,2), soft DECIMAL(5,2), idle DECIMAL(5,2), guest DECIMAL(5,2), gnice DECIMAL(5,2), PRIMARY KEY (id))").then(() => {
    mainApp.logger.info("Created Table "  + mainApp.config.get("database.tables.cpu"));
    return true;
  });
}

function generateCPUInfo() {
  return mainApp.execCommand("lscpu").then((result) => {
    result = result.split("\n");
    result.pop();
    result = result.map((f) => f.split(":")).map((k) => {
      return {
        "name": k[0].trim(),
        "value": k[1].trim()
      };
    });
    return result;
  })
}

// time returns average cpu load over time
function getCPULoad(time) {
  if (!time) {
    time = 1;
  }
  // seconds number of reports
  return mainApp.execCommand("mpstat -P ALL " + time + " 1 | tail -n +3").then((result) => {
    result = result.split("\n");
    result.pop();
    var counter = 0;
    while (counter < 1) {
      var removed = result.shift();
      if (removed === "") {
        counter++;
      }
    }
    result = result.map((f) => f.split(" ").filter((k) => k != "").map((k) => k.trim())).map((f) => {
      f.shift();
      return f;
    })
    return {"headers": result[0], "averages": result.slice(1, result.length).map((k) => k.map((f) => f.replace(",", ".")))};
  });
}

function recordCPULoad() {
  // only check for one 4th of the update time
  getCPULoad(Math.ceil(mainApp.config.get("updateTimeShort") * 0.25)).then((result) => {
    // TODO assert that not -1
    var indexCPU = result.headers.indexOf("CPU");
    var indexPercUser = result.headers.indexOf("%usr");
    var indexPercNice = result.headers.indexOf("%nice");
    var indexPercSys = result.headers.indexOf("%sys");
    var indexIOWait = result.headers.indexOf("%iowait");
    var indexIRQ = result.headers.indexOf("%irq");
    var indexSoft = result.headers.indexOf("%soft");
    var indexSteal = result.headers.indexOf("%steal");
    var indexGuest = result.headers.indexOf("%guest");
    var indexGNice = result.headers.indexOf("%gnice");
    var indexIDLE = result.headers.indexOf("%idle");

    for (var i = 0; i < result.averages.length; i++) {
      var current = result.averages[i];
      var type = current[indexCPU] === "all" ? "ALL" : "SINGLE";
      var cpu_id = current[indexCPU] === "all" ? "NULL" : current[indexCPU];
      mainApp.database.query("INSERT INTO " + mainApp.config.get("database.tables.cpu") + " (cpu_type, cpu_id, user, nice, system, iowait, irq, soft, idle, guest, gnice) VALUES ('" + type + "', " + cpu_id + ", " + current[indexPercUser] +", " + current[indexPercNice] +", " + current[indexPercSys] + ", " + current[indexIOWait]+ ", " + current[indexIRQ] +", " + current[indexSoft] +", "+ current[indexIDLE] + ", "+ current[indexGuest] +", " + current[indexGNice] +")")
    }
  }).catch((err) => {
    mainApp.logger.warn("Could not save CPU Load. The load was (cpu_type, cpu_id, user, nice, system, iowait, irq, soft, idle, guest, gnice) VALUES ('" + type + "', " + cpu_id + ", " + current[indexPercUser] +", " + current[indexPercNice] +", " + current[indexPercSys] + ", " + current[indexIOWait]+ ", " + current[indexIRQ] +", " + current[indexSoft] +", "+ current[indexIDLE] + ", "+ current[indexGuest] +", " + current[indexGNice] +")");
    mainApp.logger.warn("Error regarding CPU Load: " + err);
  });
}
