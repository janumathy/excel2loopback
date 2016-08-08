'use strict'
let _ = require('lodash')
let jsonfile = require('jsonfile')
let XLSX = require('xlsx')
jsonfile.spaces = 4

module.exports = function (inputExcelFile, modelInfoSheetName, modelMetadataSheetName, modelsConfigFile) {
  let workbook = XLSX.readFile(inputExcelFile)
  let modelInfo = XLSX.utils.sheet_to_json(workbook.Sheets[modelInfoSheetName])
  let modelMetadata = XLSX.utils.sheet_to_json(workbook.Sheets[modelMetadataSheetName])

  modelInfo = _.chain(modelInfo)
    .sortBy(value => value['Name'])
    .reject(value => value.Ignore)
    .groupBy(value => value['Name'])
    .mapValues((value, key) => {
      let metadata = _.merge({}, _.find(modelMetadata, value => value.Model === key))
      return {
        dataSource: metadata.DataSource ? metadata.DataSource : 'transient',
        public: _.lowerCase(metadata.Public) === 'true'
      }
    })
    .merge({
      '_meta': {
        'sources': ['./models'],
        'mixins': ['./mixins']
      }
    })
    .value()

  // write to model-config file
  jsonfile.writeFileSync(modelsConfigFile, modelInfo)
}
