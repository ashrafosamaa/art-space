import {Server} from 'socket.io'

let io

export function generateIO(server) {
    io = new Server(server , {
        cors:'*'
    })

    return io
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized')
    }
    return io
}
