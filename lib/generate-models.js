'use strict'
let _ = require('lodash')
let fs = require('fs-extra')
let path = require('path')
let jsonfile = require('jsonfile')
let XLSX = require('xlsx')
let customMethods = require('./generate-custom-methods')
let assert = require('assert')

const primitiveTypes = ['boolean', 'integer', 'number', 'string', 'geopoint', 'any']

module.exports = function (inputExcelFile, modelInfoSheetName, modelMetadataSheetName, modelsDir) {
  let workbook = XLSX.readFile(inputExcelFile)
  let modelInfo = XLSX.utils.sheet_to_json(workbook.Sheets[modelInfoSheetName])
  let modelMetadata = XLSX.utils.sheet_to_json(workbook.Sheets[modelMetadataSheetName])

  let modelNameKeys = _.chain(modelInfo).reject(value => value.Ignore).groupBy(value => value['Name']).keys().value()
  let modelTypeKeys = _.chain(modelInfo).reject(value => value.Ignore).groupBy(value => value['Type']).keys().pullAll(primitiveTypes).value()

  assert(_.pullAll(modelTypeKeys, modelNameKeys).length === 0, `[${_.pullAll(modelTypeKeys, modelNameKeys)}]-- Model Types are not defined`)

  modelInfo = _.chain(modelInfo)
    .reject(value => value.Ignore)
    .groupBy(value => value['Name'])
    .mapValues((value, key) => {
      let metadata = _.merge({}, _.find(modelMetadata, value => value.Model === key))
      return {
        name: key,
        base: _.lowerCase(metadata.Persisted) === 'true' ? 'PersistedModel' : 'Model',
        plural: metadata.Plural,
        idInjection: _.lowerCase(metadata.Persisted) === 'true',
        strict: 'throw',
        properties: processProperties(value),
        relations: processRelations(value),
        scope: {
          include: processIncludeFields(value)
        },
        hidden: processHiddenFields(value),
        mixins: processMixins(metadata),
        protected: processProtectedFields(value),
        methods: processMethods(value, metadata)
      }
    })
    .value()

  // ensure dir exists
  fs.ensureDirSync(modelsDir)
  // write to model files
  fs.readdirSync(modelsDir).forEach((file) => {
    if (path.extname(file) === '.json') {
      // add some items to the queue
      fs.unlinkSync(path.join(modelsDir, file))
    }
  })
  _.forEach(modelInfo, (value, key) => {
    jsonfile.writeFileSync(path.join(modelsDir, _.kebabCase(key) + '.json'), value)
  })
}

function processProperties (value) {
  let properties = _.chain(value)
    .reject(value => value.Relation)
    .groupBy(value => value['Property'])
    .mapValues((value, key) => {
      // handle date-time format
      let tempType = value[0].Format === 'date-time' ? 'date' : value[0].Type
      return {
        type: (value[0].ParentType === 'array') ? [tempType] : tempType,
        required: _.lowerCase(value[0].Required) === 'true' ? true : undefined,
        id: _.lowerCase(value[0].Id) === 'true' ? true : undefined,
        generated: _.lowerCase(value[0].Id) === 'true' ? undefined : undefined,
        default: value[0].Default,
        defaultFn: value[0].DefaultFn,
        description: value[0].Description,
        enum: value[0].EnumList ? _.chain(value[0].EnumList).trim('[').trimEnd(']').split(', ').value() : undefined
      }
    })
    .value()
  return _.isEmpty(properties) ? undefined : properties
}

function processRelations (value) {
  let relations = _.chain(value)
    .filter(value => value.Relation)
    .groupBy(value => value['Property'])
    .mapValues((value, key) => {
      switch (value[0].Relation) {
        case 'embedsOne':
        case 'embedsMany':
          return {
            type: value[0].Relation,
            model: value[0].Type,
            property: key
          }
        case 'hasOne':
        case 'hasMany':
          return {
            type: value[0].Relation,
            model: value[0].Type,
            foreignKey: _.lowerFirst(value[0].Name + 'Number')
              // TODO : handle duplicate
          }
        case 'belongsTo':
          return {
            type: value[0].Relation,
            model: value[0].Type,
            foreignKey: _.lowerFirst(value[0].Type + 'Number')
              // TODO : handle duplicate
          }
        default:
          console.log()
      }
    })
    .mapKeys((value, key) => {
      switch (value.type) {
        case 'embedsOne':
        case 'embedsMany':
          return '_' + key
        default:
          return key
      }
    })
    .value()
  return _.isEmpty(relations) ? undefined : relations
}

function processHiddenFields (value) {
  return _.chain(value)
    .filter(value => value.Hidden)
    .map(value => value.Property)
    .union(['id'])
    .value()
}

function processProtectedFields (value) {
  return _.chain(value)
    .filter(value => value.Protected)
    .map(value => value.Property)
    .union(['id'])
    .value()
}

function processIncludeFields (value) {
  return _.chain(value)
    .filter(value => value.Relation)
    .filter(value => _.lowerCase(value.Include) === 'true')
    .map((value, key) => value.Property)
    .value()
}

function processMixins (modelMetadata) {
  let mixins = {
    'Rsql': _.lowerCase(modelMetadata.Rsql) === 'true' ? true : undefined,
    'Pagination': _.lowerCase(modelMetadata.Pagination) === 'true' ? true : undefined,
    'Jsonapi': _.lowerCase(modelMetadata.Jsonapi) === 'true' ? true : undefined,
    'MethodsToExpose': _.chain(modelMetadata.MethodsToExpose)
      .trim().trim('[').trimEnd(']').split(',')
      .map(value => _.trim(value))
      .filter(value => value.length > 0)
      .groupBy(value => 'list')
      .value()
  }
  mixins = _.pickBy(mixins, value => _.isObject(value) ? !_.isEmpty(value) : !_.isNil(value))
  return _.isEmpty(mixins) ? undefined : mixins
}

function processMethods (value, modelMetadata) {
  let methodsToExpose = _.chain(modelMetadata.MethodsToExpose)
    .trim().trim('[').trimEnd(']').split(',')
    .map(value => _.trim(value))
    .value()

  let methods = {
    find: _.includes(methodsToExpose, 'find') ? customMethods.find(value, modelMetadata) : undefined,
    findById: _.includes(methodsToExpose, 'findById') ? customMethods.findById(value, modelMetadata) : undefined
  }
  methods = _.pickBy(methods, value => _.isObject(value) ? !_.isEmpty(value) : !_.isNil(value))
  return _.isEmpty(methods) ? undefined : methods
}
