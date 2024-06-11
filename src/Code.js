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

const STATUS_TO_VALIDATE = 0
const STATUS_VALIDATE = 1

// Import the GasCrypt library for encryption
const gc = bmSimpleCrypto.GasCrypt;

/** ENDPOINTS */

/**
 * Handles the HTTP GET request for the web app.
 * If the request contains a parameter 'json', it returns a JSON response with user data.
 * If the request does not contain the 'json' parameter, it renders the 'page.html' template.
 *
 * @param {Object} e - The event object containing the request parameters.
 * @return {Content} - The HTTP response content.
 */
function doGet(e) {
  Logger.log(e.pathInfo)
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
  }
  if (e && e.pathInfo && e.pathInfo === "melee") {
    // Render the 'melee.html' template
    return HtmlService.createTemplateFromFile('melee.html').evaluate();
  }
  else {
    // Render the 'page.html' template
    return HtmlService.createTemplateFromFile('page.html').evaluate();
  }
}

/**
 * Converts a base64 string to its original data.
 *
 * @param {string} base64 - The base64 string to be converted.
 * @return {string} - The original data as a string.
 */
function convert(base64) {
  let result = Utilities.newBlob(Utilities.base64Decode(base64)).getDataAsString()
  Logger.log(result)
  return result
}

/**
 * Handles the HTTP POST request for the web app.
 * This function is currently empty and needs to be implemented.
 *
 * @param {Object} e - The event object containing the request parameters.
 */
function getMessage(secret, message) {
  if (checkCode(secret, SECRET) && message.length > 5) {
    sendSmsToAll(message)
    return JSON.stringify({ result: 'OK', message: message });
  } else {
    return JSON.stringify({ error: '400', message: message, secret: secret });
  }
}



/**
 * Writes phone number, first name, and last name into a spreadsheet.
 *
 * @param {number} phoneNumber - The phone number submitted from the web app.
 * @param {string} firstName - The first name submitted from the web app.
 * @param {string} lastName - The last name submitted from the web app.
 * @param {string} code - The code to check.
 */
function userClicked(phoneNumber, firstName = "test", lastName = "test", code) {
  // Check if the code is valid
  if (checkCode(code, CODE)) {
    var spreadsheet = SpreadsheetApp.openByUrl(SHEET_URL);
    var sheet = spreadsheet.getSheets()[0];
    // Check if the phone number is provided
    if (phoneNumber) {
      // Check if the user already exists
      if (!getUser(phoneNumber)) {
        // Append a new row with the current date, phone number, first name, and last name
        sheet.appendRow([new Date(), parseInt(phoneNumber), firstName, lastName, STATUS_VALIDATE]);
        // Send a notification
        sendNotification(`Adding ${phoneNumber} ${firstName} ${lastName}`);
        // Send an SMS to the user
        sendSms(phoneNumber, `${firstName} ${lastName}, vous avez été inscrit à la liste de diffusion pour la pétanque. ${SHORT_URL}`);
      } else {
        // Log that the phone number is already inserted
        sendNotification(`Already added ${phoneNumber} ${firstName} ${lastName}`);
        Logger.log(phoneNumber + " already inserted!");
      }
    }
  }
}
/**
 * Removes a user from the spreadsheet based on their phone number.
 *
 * @param {string} phone - The phone number of the user.
 * @param {string} code - The verification code.
 */
function userRemoved(phone, code) {
  // Check if the code is valid
  if (checkCode(code, CODE)) {
    // Open the spreadsheet
    var spreadsheet = SpreadsheetApp.openByUrl(SHEET_URL);
    // Get all the rows in the spreadsheet
    var rows = spreadsheet.getDataRange();
    // Get the values of all the rows
    var values = rows.getValues();
    // Array to store the row numbers to be deleted
    var toDelete = [];

    // Iterate through the rows
    for (var row = 1; row < values.length; row++) {
      let v = values[row][1];
      // If the phone number matches, add the row number to the toDelete array
      if (v && parseInt(v) == parseInt(phone)) {
        toDelete.push(row);
      }
    }

    // Iterate through the toDelete array in reverse order
    for (var deleteRow = toDelete.length - 1; deleteRow >= 0; deleteRow--) {
      // Delete the row from the spreadsheet
      spreadsheet.deleteRow(toDelete[deleteRow] + 1);
    }

    // Send a notification about the removal
    sendNotification(`Removing ${phone}`);

    // Send an SMS to the user informing them about the removal
    sendSms(phone, `Vous avez été désinscrit de la liste de diffusion pour la pétanque. ${SHORT_URL}`)
  }
};

/**
 * Retrieves user data from a spreadsheet.
 * @returns {Array} - An array of user objects with phone numbers, first names, and last names.
 */
function getUsers(filter) {
  // Open the spreadsheet using its URL
  var spreadsheet = SpreadsheetApp.openByUrl(SHEET_URL);

  // Get all the rows in the spreadsheet
  var rows = spreadsheet.getDataRange();

  // Get the values in the rows
  var values = rows.getValues();

  // Create an empty array to store the user data
  var result = [];

  // Loop through each row starting from the second row
  for (var row = 1; row < values.length; row++) {
    // Extract the phone number, first name, and last name from the values
    let phone = parseInt(values[row][1]);
    let firstName = values[row][2];
    let lastName = values[row][3];
    let status = values[row][4];
    // Create a user object and add it to the result array
    var user = {
      phone: phone,
      firstName: firstName,
      lastName: lastName,
      status: status
    };
    result.push(user);
  }



  // Return the result array
  if (!filter) {
    Logger.log(result);
    return result;
  } else {
    result = result.filter(f => parseInt(f.status) === parseInt(filter));
    Logger.log(result);
    return result
  }

}

/**
 * Retrieves user data for a given phone number.
 * @param {string} mobile - The phone number of the user.
 * @returns {Object|undefined} - The user object if found, otherwise undefined.
 */
function getUser(mobile) {
  let result = getUsers().filter(f => parseInt(f.phone) === parseInt(mobile))
  if (result.length > 0) result = result[0]
  else result = undefined
  Logger.log(result)
  return result
}
/**
 * Sends text messages to all users listed in the Google Sheet.
 * 
 * @param {string} message - The message to be sent.
 */
function sendSmsToAll(message) {
  // Get the list of users from the Google Sheet
  let users = getUsers(1);

  // Iterate over each user and send them a text message
  users.forEach(user => sendSms(user.phone, message));

  // Send a notification indicating that the message has been sent to all users
  sendNotification(`Message sent : ${message} to ${users.map(m => m.firstName).join(' ')}`);
}

/**
 * Send an SMS with the specified phone number and message.
 * @param {string} phoneNumber - The phone number to send the SMS to.
 * @param {string} message - The message content.
 * @returns {boolean} - True if the SMS was sent successfully, false otherwise.
 */
function sendSms(phoneNumber, message) {
  if (message && message.length > 3) {
    try {
      let payload = {
        "content": message,
        "from": formatPhoneNumber(PHONE_NUMBER_FROM),
        "to": formatPhoneNumber(phoneNumber)
      }
      let response = UrlFetchApp.fetch(HTTPSMS_URL, {
        method: 'post',
        headers: {
          "Accept": 'application/json',
          "Content-Type": 'application/json',
          "x-api-key": HTTPSMS_KEY
        },
        payload: JSON.stringify(payload)
      });

      Logger.log(`${message} sent to ${phoneNumber} ${response.getContentText()}:  ${new Date()}`)
      return true;
    } catch (err) {
      Logger.log(`${message} not sent to ${phoneNumber}:  ${err} ${payload}`)
      return false;
    }
  }
}

/**
 * Formats a phone number by adding a '+' at the beginning if it doesn't already have one.
 *
 * @param {string} phoneNumber - The phone number to be formatted.
 * @return {string} The formatted phone number.
 */
function formatPhoneNumber(phoneNumber) {
  if (phoneNumber && !phoneNumber.toString().startsWith('+')) {
    return `+${phoneNumber}`
  } else {
    return phoneNumber
  }
}

/**
 * Send a notification with the specified message.
 * @param {string} message - The notification message.
 */
function sendNotification(message = 'test') {
  if (message && message.length > 3) {
    try {
      // Send the notification using UrlFetchApp.fetch
      UrlFetchApp.fetch(NTFY_URL, {
        method: 'post',
        headers: {
          "Title": "Pétanque"
        },
        payload: message,
      });
      Logger.log(`${message} sent:  ${new Date()}`)
    } catch (err) {
      Logger.log(`${message} not sent:  ${new Date()}`)
    }
  }
}

/***
 * Check if the provided code is correct.
 * @param {string} code - The code to check.
 * @returns {boolean} - True if the provided code is correct, false otherwise.
 */
function checkCode(code, secret) {
  if (code && code.toString().toUpperCase() === secret.toString().toUpperCase()) {
    return true
  } else {
    console.warn('Code erroné: ' + code)
    return false
  }
}

/**
 * Retrieves the CSS content from the "stylesheet.html" file.
 *
 * @return {string} The content of the CSS file.
 */
function getCss() {
  return HtmlService.createHtmlOutputFromFile("stylesheet.html").getContent();
}

/**
 * Handles the HTTP POST request for the web app.
 *
 * @param {Object} e - The event object containing the request parameters.
 * @return {Content} - The HTTP response content.
 */
function doPost(e) {
  let sms = JSON.parse(e.postData.contents);
  var spreadsheet = SpreadsheetApp.openByUrl(SHEET_URL);
  var sheet = spreadsheet.getSheets()[1]; //logs
  sheet.appendRow([sms.sentStamp, sms.receivedStamp, sms.from, sms.text,sms.sim]);
  return ContentService
    .createTextOutput(JSON.stringify({}))
    .setMimeType(ContentService.MimeType.JSON);
}
