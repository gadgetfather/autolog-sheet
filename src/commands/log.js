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
    const spreadsheetId = '1bhPXHDXPlFxGxhRMa3AjZeTHvJTqDRqDTjER4R9-l9g'
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
    const range = 'Sheet1!A1:C10' // Replace with your desired range
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range, // Adjust the range according to your needs
    })
    const existingRows = data.values || []

    const newCommits = [
      /* ... your new commits data ... */
    ]
    const existingCommitsHashes = new Set(existingRows.map((row) => row[0])) // Assuming commit hash is in the first column

    const uniqueCommits = newCommits.filter(
      (commit) => !existingCommitsHashes.has(commit.commit)
    )

    // Add data to Google Sheets
    // Replace with your Spreadsheet ID
    const sheetData = uniqueCommits.map((commit) => [
      commit.date,
      commit.author,
      commit.commit,
      commit.message,
    ])
    if (sheetData.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: sheetData,
        },
      })
    } else {
      toolbox.print.info('No new data to add.')
    }

    toolbox.print.info('Data added to Google Sheets.')
  },
}

module.exports = command
