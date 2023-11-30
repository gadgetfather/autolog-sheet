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
    const spreadsheetId = '1bhPXHDXPlFxGxhRMa3AjZeTHvJTqDRqDTjER4R9-l9g' // Replace with your Spreadsheet ID
    const range = 'Sheet1!A1:C10' // Replace with your desired range
    const sheetData = commits.map((commit) => [
      commit.date,
      commit.author,
      commit.commit,
      commit.message,
    ])
    const headers = ['Date', 'Author', 'Commit', 'Message']
    sheetData.unshift(headers)
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: sheetData,
      },
    })

    toolbox.print.info('Data added to Google Sheets.')
  },
}

module.exports = command
