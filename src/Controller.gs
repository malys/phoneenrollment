// https://techandeco.medium.com/create-an-apps-script-web-app-to-collect-phone-numbers-to-text-message-customers-updates-b0fccc9b10d4

// Define constant variables for script properties
const SHEET_URL = PropertiesService.getScriptProperties().getProperty('SHEETS_URL');
const HTTPSMS_URL = PropertiesService.getScriptProperties().getProperty('HTTPSMS_URL');
const NTFY_URL = PropertiesService.getScriptProperties().getProperty('NTFY_URL');
const CODE = PropertiesService.getScriptProperties().getProperty('CODE');
const SECRET = PropertiesService.getScriptProperties().getProperty('SECRET');
const HTTPSMS_KEY = PropertiesService.getScriptProperties().getProperty('HTTPSMS_KEY');
const PHONE_NUMBER_FROM = PropertiesService.getScriptProperties().getProperty('PHONE_NUMBER_FROM');
const SHORT_URL = PropertiesService.getScriptProperties().getProperty('SHORT_URL');

const spreadsheet = SpreadsheetApp.openByUrl(SHEET_URL);
const USERS = spreadsheet.getSheets()[0];
const LOGS = spreadsheet.getSheets()[1];

const STATUS_TO_VALIDATE = 0
const STATUS_VALIDATE = 1

// Import the GasCrypt library for encryption
const gc = bmSimpleCrypto.GasCrypt;

/***************************************** ENDPOINTS *****************************************/

/**
 * Handles the HTTP GET request for the web app.
 * If the request contains a parameter 'json', it returns a JSON response with user data.
 * If the request does not contain the 'json' parameter, it renders the 'page.html' template.
 *
 * @param {Object} e - The event object containing the request parameters.
 * @return {Content} - The HTTP response content.
 */
function doGet(e) {
  // Check if the request contains the 'json' parameter
  if (e && e.parameters) {
    if (e.parameters.json) {
      // Retrieve user data
      var content = getUsers();

      // Create and return a JSON response
      return ContentService.createTextOutput(content)
        .setMimeType(ContentService.MimeType.JSON);
    }
    else if (e.parameters.secret && e.parameters.message) {
      let message = getMessage(e.parameters.secret, convert(e.parameters.message))
      return ContentService.createTextOutput(message).setMimeType(ContentService.MimeType.JSON);
    }
    else if (e.parameters.melee) {
      // Render the 'melee.html' template
      return HtmlService.createTemplateFromFile('melee.html').evaluate();
    }
    else if (e.parameters.freeusers) {
      // Render the 'freeUsers.html' template
      return HtmlService.createTemplateFromFile('freeUsers.html').evaluate();
    }
  }
  // Render the 'page.html' template
  return HtmlService.createTemplateFromFile('page.html').evaluate();

}

/**
 * Handles the HTTP POST request for logs.
 *
 * @param {Object} e - The event object containing the request parameters.
 * @return {Content} - The HTTP response content.
 */
function doPost(e) {
  let sms = JSON.parse(e.postData.contents);
  var sheet = LOGS;
  sheet.appendRow([sms.sentStamp, sms.receivedStamp, sms.from, sms.text, sms.sim]);
  return ContentService
    .createTextOutput(JSON.stringify({}))
    .setMimeType(ContentService.MimeType.JSON);
}



