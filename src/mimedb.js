module.exports = {
    "application/json": {
        "charset": "UTF-8",
        "compressible": true,
        "extensions": ["json"]
    },
    "application/octet-stream": {
        "compressible": false,
        "extensions": ["bin"]
    },
    "application/x-www-form-urlencoded": {
        "compressible": true
    },
    "multipart/form-data": {
        "compressible": false
    },
    "text/html": {
        "compressible": true,
        "extensions": ["html", "htm", "shtml"]
    },
    "text/plain": {
        "compressible": true,
        "extensions": ["txt", "text", "log", "ini"]
    },
};