import { useCallback, useEffect, useRef, useState } from 'react'
import type { WSMessage, WSStatus } from '../types'

interface UseWebSocketReturn {
  status: WSStatus
  messages: WSMessage[]
  send: (data: string) => void
  clear: () => void
  connect: (url: string) => void
  disconnect: () => void
}

export function useWebSocket(initialUrl?: string): UseWebSocketReturn {
  const [status, setStatus] = useState<WSStatus>('closed')
  const [messages, setMessages] = useState<WSMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const urlRef = useRef<string | undefined>(initialUrl)

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const connect = useCallback((url: string) => {
    disconnect()
    urlRef.current = url
    setStatus('connecting')

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setStatus('open')

      ws.onmessage = (event: MessageEvent<string>) => {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            direction: 'received',
            data: typeof event.data === 'string' ? event.data : JSON.stringify(event.data),
          },
        ])
      }

      ws.onerror = () => setStatus('error')
      ws.onclose = () => setStatus('closed')
    } catch {
      setStatus('error')
    }
  }, [disconnect])

  const send = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data)
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), timestamp: new Date(), direction: 'sent', data },
      ])
    }
  }, [])

  const clear = useCallback(() => setMessages([]), [])

  useEffect(() => {
    if (initialUrl) connect(initialUrl)
    return () => disconnect()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  return { status, messages, send, clear, connect, disconnect }
}
