const { google } = require('googleapis')
const { execSync } = require('child_process')
const credentials = require('./credential.json')
const command = {
  name: 'log',
  run: async (toolbox) => {
    const { print } = toolbox

    const output = execSync(
      'git log --since="00:00:00" --until="23:59:59" --pretty=format:\'{%n  "commit": "%H",%n  "author": "%aN <%aE>",%n  "date": "%ad",%n  "message": "%f"%n},\''
    ).toString()

    // Formatting the output into a valid JSON array
    const jsonOutput = `[${output.slice(0, -1)}]`

    // Parse JSON string into an array of objects
    const commits = JSON.parse(jsonOutput)

    toolbox.print.info(commits)
    print.info('Welcome to LOG')
    // Authenticate with Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Add data to Google Sheets
    const spreadsheetId = 'your-spreadsheet-id' // Replace with your Spreadsheet ID
    const range = 'Sheet1!A1' // Replace with your desired range

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [commits], // Add your data here
      },
    })

    toolbox.print.info('Data added to Google Sheets.')
  },
}

module.exports = command
