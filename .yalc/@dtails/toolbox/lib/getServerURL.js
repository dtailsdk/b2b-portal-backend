'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getServerURL = getServerURL;

var _index = require('./index');

var _queryString = require('query-string');

//import { R } from '@mekanisme/common'
function getServerURL(path, query) {
  if ((0, _index.getEnvironment)('SERVER_URL', false)) {
    //If SERVER_URL is set return that instead of the real URL
    return _index.R.join('', [(0, _index.getEnvironment)('SERVER_URL').trim('/'), path ? `/${path.replace(/^\/+/, '')}` : '', query ? `?${(0, _queryString.stringify)(query, { encode: true })}` : '']);
  }

  const host = (0, _index.getEnvironment)('HOST');
  const port = (0, _index.getEnvironment)('PORT', 3000);
  const https = JSON.parse((0, _index.getEnvironment)('HTTPS', false));

  const url = _index.R.join('', [https ? 'https' : 'http', '://', host.replace(/\/+$/, ''), port ? `:${port}` : '', path ? `/${path.replace(/^\/+/, '')}` : '', query ? `?${(0, _queryString.stringify)(query, { encode: true })}` : '']);

  return url;
}