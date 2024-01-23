const Readable = require('stream').Readable; 
const { CommandType } = require('eufy-security-client');

exports.until = async function (predFn) {
    const poll = (done) => (predFn() ? done() : setTimeout(() => poll(done), 500));
    return new Promise(poll);
};

// get
exports.get = function (obj, dirtyPath, defaultValue) {
    if (obj === undefined || obj === null) return defaultValue;
    const path = typeof dirtyPath === 'string' ? dirtyPath.split('.') : dirtyPath;
    let objLink = obj;
    if (Array.isArray(path) && path.length) {
        for (let i = 0; i < path.length - 1; i++) {
            const currentVal = objLink[path[i]];
            if (currentVal !== undefined && currentVal !== null) {
                objLink = currentVal;
            } else {
                return defaultValue;
            }
        }
        const value = objLink[path[path.length - 1]];
        return value === undefined || value === null ? defaultValue : value;
    }
    return defaultValue;
};

exports.keyByValue = function (obj, value) {
    return Object.keys(obj).find((key) => obj[key] === value);
};

exports.keyByValueIncludes = function (obj, value) {
    return Object.keys(obj).find((key) => value.includes(obj[key]));
};

exports.sleep = async function (ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

exports.randomNumber = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.bufferToStream = function(buffer) { 
  var stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
}

exports.streamToBuffer = function(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on('data', data => {
        if (typeof data === 'string') {
          // Convert string to Buffer assuming UTF-8 encoding
          chunks.push(Buffer.from(data, 'utf-8'));
        } else if (data instanceof Buffer) {
          chunks.push(data);
        } else {
          // Convert other data types to JSON and then to a Buffer
          const jsonData = JSON.stringify(data);
          chunks.push(Buffer.from(jsonData, 'utf-8'));
        }
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

exports.isNil = function (value) {
    return value === null || value === undefined || value === '';
}
