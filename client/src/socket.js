import { io } from 'socket.io-client'

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ?
    "http://uno-api.notkal.com:3001" :              // Production endpoint
    'http://localhost:3001'; // Development

export const socket = io(URL);