// Define options for Date#toLocaleTimeString call we will use.
var twoDigit = '2-digit';
var options = {
  day: twoDigit,
  month: twoDigit,
  year: twoDigit,
  hour: twoDigit,
  minute: twoDigit,
  second: twoDigit
};

exports.formatter = (args) => {
  var dateTimeComponents = new Date().toLocaleTimeString('de-DE', options).split(',');
  var logMessage = "[" +  dateTimeComponents[0] + dateTimeComponents[1] + "][" +args.level + ']'+ (args.message.startsWith("[") ? "" : " ") + args.message.replace("].", "] ");
  return logMessage;
}
