import { useEffect, useRef } from 'react'
import io, { Socket } from 'socket.io-client'

export const useSocket = (url: string) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(url, {
      path: '/api/socketio'
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [url])

  return socketRef.current
}