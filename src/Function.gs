/***************************************** FUNCTIONS *****************************************/

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
 * Retrieves the CSS content from the "stylesheet.html" file.
 *
 * @return {string} The content of the CSS file.
 */
function getCss() {
  return HtmlService.createHtmlOutputFromFile("stylesheet.html").getContent();
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