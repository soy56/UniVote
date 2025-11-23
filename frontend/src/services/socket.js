import { io } from 'socket.io-client';

import API_BASE_URL from '../config';

const SOCKET_URL = API_BASE_URL;

let socket;

export const connectSocket = (userId) => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: false
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            if (userId) {
                socket.emit('register', userId);
            }
        });
    } else if (userId) {
        // If socket exists but we need to ensure registration (e.g. re-login)
        if (socket.connected) {
            socket.emit('register', userId);
        } else {
            socket.on('connect', () => {
                socket.emit('register', userId);
            });
        }
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;
