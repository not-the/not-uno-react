import { io } from 'socket.io-client'

const isProduction = process.env.NODE_ENV === 'production';

// "undefined" means the URL will be computed from the `window.location` object
const URL = isProduction ?
    "http://uno-api.notkal.com:8080" :              // Production endpoint
    'http://localhost:8080'; // Development

const socket = io(URL);

export { socket, isProduction }
