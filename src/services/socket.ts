import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const initializeSocket = (token: string): Socket => {
  if (socket?.connected) return socket

  socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('Socket conectado')
  })

  socket.on('disconnect', () => {
    console.log('Socket desconectado')
  })

  socket.on('connect_error', (error) => {
    console.error('Error de conexión:', error)
  })

  return socket
}

export const getSocket = (): Socket | null => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const socketEvents = {
  tableUpdate: 'table:update',
  gameStart: 'game:start',
  cardPlayed: 'game:card-played',
  trucoCalled: 'game:truco-called',
  envidoCalled: 'game:envido-called',
  florCalled: 'game:flor-called',
  chatMessage: 'chat:message',
}