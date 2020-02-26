'use strict';

/**
 * lambda function handling books requests
 */
const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB();

exports.handler = (event, context, callback) => {
  const id = event.pathParameters ? event.pathParameters.id : null;
  const { TABLE_NAME } = process.env;
  AWSXRay.captureFunc('root', function(subsegment) {
    switch (event.httpMethod) {
      case 'POST':
        postFunction(event, callback, exports, context, TABLE_NAME);
        break;
      case 'GET':
        if (id) {
          return getByIdFunction(id, TABLE_NAME, callback);
        }
        getAllFunction(TABLE_NAME, callback);
        break;
      case 'PUT':
        putFunction(id, TABLE_NAME, callback, event);
        break;
      case 'DELETE':
        delFunction(id, TABLE_NAME, callback);
        break;
      default:
        const message = `unsupported HTTP method ${event.httpMethod}`;
        createResponse(message, null, callback);
        break;
    }
  });
};

function delFunction(id, TABLE_NAME, callback) {
  AWSXRay.captureFunc('del', function(subsegment) {
    dynamodb.deleteItem(
      {
        Key: AWS.DynamoDB.Converter.marshall({ id }),
        TableName: TABLE_NAME
      },
      (err, data) => {
        if (err)
          callback(null, {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: err })
          });
        callback(null, {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({})
        });
      }
    );
  });
}

function putFunction(id, TABLE_NAME, callback, event) {
  AWSXRay.captureFunc('put', function(subsegment) {
    dynamodb.getItem(
      {
        Key: AWS.DynamoDB.Converter.marshall({ id }),
        TableName: TABLE_NAME
      },
      (err, data) => {
        if (err)
          callback(null, {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: err })
          });
        const retrievedItem = AWS.DynamoDB.Converter.unmarshall(data.Item);
        const newItem = {
          ...retrievedItem,
          ...JSON.parse(event.body),
          id
        };
        dynamodb.putItem(
          {
            Item: AWS.DynamoDB.Converter.marshall(newItem),
            TableName: TABLE_NAME
          },
          (err, data) => {
            if (err)
              callback(null, {
                statusCode: 400,
                headers: {
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: err })
              });
            callback(null, {
              statusCode: 200,
              headers: {
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify(data)
            });
          }
        );
      }
    );
  });
}

function getAllFunction(TABLE_NAME, callback) {
  AWSXRay.captureFunc('getall', function(subsegment) {
    dynamodb.scan({ TableName: TABLE_NAME }, (err, data) => {
      if (err)
        callback(null, {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: err })
        });
      callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data.Items.map(item => AWS.DynamoDB.Converter.unmarshall(item)))
      });
    });
  });
}

function getByIdFunction(id, TABLE_NAME, callback) {
  AWSXRay.captureFunc('getbyid', function(subsegment) {
    dynamodb.getItem(
      {
        Key: AWS.DynamoDB.Converter.marshall({ id }),
        TableName: TABLE_NAME
      },
      (err, data) => {
        if (err)
          callback(null, {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: err })
          });
        callback(null, {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify(AWS.DynamoDB.Converter.unmarshall(data.Item))
        });
      }
    );
    return;
  });
}

function postFunction(event, callback, exports, context, TABLE_NAME) {
  AWSXRay.captureFunc('post', function(subsegment) {
    const bookId = uuidv4();
    dynamodb.putItem(
      {
        Item: AWS.DynamoDB.Converter.marshall({
          ...JSON.parse(event.body),
          id: bookId
        }),
        TableName: TABLE_NAME
      },
      (err, data) => {
        if (err)
          callback(null, {
            statusCode: 400,
            headers: {
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: err })
          });
        exports.handler({ pathParameters: { id: bookId }, httpMethod: 'GET' }, context, callback);
      }
    );
  });
}

function createResponse(message, callback) {
  callback(null, {
    statusCode: 400,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: message })
  });
}
