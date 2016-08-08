'use strict'

var chalk = require('chalk')
var fs = require('fs-extra')
var XLSX = require('xlsx')

module.exports = function (inputExcelFile, modelConfigFile, modelDir, modelInfoSheetName, modelMetadataSheetName) {
  let invalidArgs = false

  if (!isExcelFile(inputExcelFile)) {
    console.error(chalk.red(`${inputExcelFile} is not a valid Excel File`))
    invalidArgs = true
  } else if (!hasSheet(inputExcelFile, modelInfoSheetName)) {
    console.error(chalk.red(`${modelInfoSheetName} Sheet is missing in Excel File`))
    invalidArgs = true
  } else if (!hasSheet(inputExcelFile, modelMetadataSheetName)) {
    console.error(chalk.red(`${modelMetadataSheetName} Sheet is missing in Excel File`))
    invalidArgs = true
  } else if (!isDirectory(modelDir)) {
    console.error(chalk.red(`${modelDir} is not a valid Directory`))
    invalidArgs = true
  }
  return invalidArgs
}

function isExcelFile (fileName) {
  try {
    var stats = fs.statSync(fileName)
    if (stats.isFile()) {
      XLSX.readFile(fileName)
      return true
    }
  } catch (err) {
    return false
  }
}

function hasSheet (fileName, sheetName) {
  try {
    return XLSX.readFile(fileName).Sheets[sheetName] !== undefined
  } catch (err) {
    return false
  }
}

function isDirectory (folderName) {
  try {
    fs.ensureDirSync(folderName)
    return fs.statSync(folderName).isDirectory()
  } catch (err) {
    return false
  }
}
