/***************************************** BUSINESS *****************************************/
/*********** USERS ***********/
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
    var sheet = USERS
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
    var spreadsheet = USERS;
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
  var spreadsheet = USERS;

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

  // Clean logs
  cleanLogs();
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



/*********** LOGS ***********/
/**
 * Clears the contents of the LOGS sheet.
 *
 * @return {void} This function does not return a value.
 */
function cleanLogs() {
  LOGS.clearContents();
}

/**
 * Retrieves logs from the LOGS sheet in the spreadsheet.
 *
 * @return {Array} An array of log objects containing phone numbers and messages.
 */
function getLogs() {
  // Get all the rows in the spreadsheet
  var rows = LOGS.getDataRange();
  // Get the values in the rows
  var values = rows.getValues();
  // Create an empty array to store the user data
  var result = [];


  //Remove duplicate entry
  values = values.filter((value, index) => {
    const _value = JSON.stringify(value);
    return index === values.findIndex(obj => {
      return JSON.stringify(obj) === _value;
    });
  });

  // Loop through each row starting from the second row
  for (var row = 1; row < values.length; row++) {
    // Extract the phone number, first name, and last name from the values
    let phone = parseInt(values[row][2]);
    let message = values[row][3];

    let entry = result.find(f => f.phone === phone)
    if (entry) {
      //Concatenate messages
      entry.message = entry.message + ' ' + message
    } else {
      // Create a user object and add it to the result array
      var logs = {
        phone: phone,
        message: message
      };
      result.push(logs);
    }
  }

  Logger.log(result);
  return result

}

/**
 * Counts the number of free users by filtering out users who have sent a message with the words '0', 'pas', or 'non'.
 *
 * @return {number} The number of free users.
 */
function countFreeUsers() {
  let list = getUsers(1).map(m => m.phone)
  let logs = getLogs().filter(f => list.includes(f.phone))

  let answers = logs.map(m => m.phone)
  let notFree = logs.filter(f => {
    let mes = String(f.message)
    return mes && (mes.indexOf('0') > -1 || mes.indexOf('pas') > -1 || mes.indexOf('non') > -1)
  }).map(m => m.phone)

  let result = answers.length - notFree.length + 1
  Logger.log(answers);
  Logger.log(notFree);
  return result
}
