const { google } = require('googleapis')
const { execSync } = require('child_process')
const credentials = require('./credential.json')
//comment
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
    const range = 'Sheet1!A1:C10' // Replace with your desired range

    // Parse JSON string into an array of objects
    const newCommits = JSON.parse(jsonOutput)

    toolbox.print.info(newCommits)
    print.info('Welcome to LOG')
    // Authenticate with Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range, // Assuming the commit hash is in column A
    })

    const existingCommits = new Set(data.values ? data.values.flat() : [])

    // Filter out duplicate entries
    const uniqueCommits = newCommits.filter(
      (commit) => !existingCommits.has(commit.commit)
    )
    console.log({ existingCommits, newCommits, uniqueCommits })
    // Format data for Sheets
    const sheetData = uniqueCommits.map((commit) => [
      commit.date,
      commit.author,
      commit.commit,
      commit.message,
    ])
    console.log(sheetData)
    if (sheetData.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: sheetData,
        },
      })
      toolbox.print.info('Data added to Google Sheets.')
    } else {
      toolbox.print.info('No new data to add.')
    }
  },
}

module.exports = command
