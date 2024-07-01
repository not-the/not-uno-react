import { io } from 'socket.io-client'

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ?
    undefined :              // Production endpoint
    // 'http://localhost:3001'; // Development
    'http://10.0.0.29:3001'; // Development

export const socket = io(URL);