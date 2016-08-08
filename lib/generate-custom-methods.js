'use strict'

let _ = require('lodash')

module.exports = {
  find: find,
  findById: findById
}

function find (value, modelMetadata) {
  let method = {
    isStatic: true,
    description: `The implementation of this interface retrieves a list of ${value[0].Name}s`,
    accepts: [],
    returns: {
      type: [value[0].Name],
      root: true
    },
    http: {
      path: '/',
      verb: 'get'
    }
  }
  if (_.lowerCase(modelMetadata.Jsonapi) === 'true') {
    method.returns = {
      type: `${value[0].Name}Collection`,
      root: true
    }
    method.accepts = _.concat(method.accepts, [{
      arg: 'limit',
      type: 'number',
      http: {
        source: 'query'
      },
      description: 'indicates the number of items per page.'
    }, {
      arg: 'offset',
      type: 'number',
      http: {
        source: 'query'
      },
      description: 'indicates the item number to start from, i.e. skip the items previous to the offset value.'
    }, {
      arg: 'order',
      type: 'string',
      http: {
        source: 'query'
      },
      description: 'specify whether ascending or descending.'
    }, {
      arg: 'orderBy',
      type: 'string',
      http: {
        source: 'query'
      },
      description: 'field name by which to order the list.'
    }])
  }

  if (_.lowerCase(modelMetadata.Rsql) === 'true') {
    method.accepts = _.concat(method.accepts, [{
      arg: 'q',
      type: 'string',
      http: {
        source: 'query'
      },
      description: 'By specifying the query parameters, filter and retrieve limited items.'
    }])
  }

  return method
}

function findById (value, modelMetadata) {
  let method = {
    isStatic: true,
    description: `The implementation of this interface retrieves a specific ${value[0].Name} corresponding to
    the unique ID.`,
    accepts: [],
    returns: {
      type: value[0].Name,
      root: true
    },
    http: {
      path: '/{id}',
      verb: 'get'
    }
  }
  method.accepts = _.concat(method.accepts, [{
    arg: 'id',
    type: 'number',
    http: {
      source: 'path'
    },
    required: true,
    description: 'Number'
  }])
  if (_.lowerCase(modelMetadata.Jsonapi) === 'true') {
    method.returns = {
      type: `${value[0].Name}Item`,
      root: true
    }
  }
  return method
}
