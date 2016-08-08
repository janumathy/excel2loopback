#!/usr/bin/env node

'use strict'
var args = require('commander')
var path = require('path')
var validationUtil = require('./validation-util')
var generateModels = require('./generate-models')
var generateModelConfig = require('./generate-model-config')

args.option('-i, --inputExcelFile <inputExcelFile>', '\'File Localtion\' which contains Loopback Model definations', './example/Models.xls')
  .option('-m, --modelDir <outputDir>', '\'Output Directory\' where Loopback model files should be generated', './server/models')
  .option('-c, --modelConfigFile <sheetName>', '\'File Localtion\' which contains Loopback Model Config definations', './server/model-config.json')
  .parse(process.argv)

let inputExcelFile = path.resolve('.', args.inputExcelFile)
let modelDir = path.resolve('.', args.modelDir)
let modelConfigFile = path.resolve('.', args.modelConfigFile)
let modelInfoSheetName = 'Info'
let modelMetadataSheetName = 'Metadata'

if (validationUtil(inputExcelFile, modelConfigFile, modelDir, modelInfoSheetName, modelMetadataSheetName)) {
  args.help()
} else {
  generateModels(inputExcelFile, modelInfoSheetName, modelMetadataSheetName, modelDir)
  generateModelConfig(inputExcelFile, modelInfoSheetName, modelMetadataSheetName, modelConfigFile)
}
