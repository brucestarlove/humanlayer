import { useRef, useEffect } from 'react'
import { ConversationEvent, ConversationEventType } from '@/lib/daemon/types'
import { MinimapItem } from './MinimapItem'

interface MinimapWidgetProps {
  events: ConversationEvent[]
  focusedEventId: number | null
  onEventClick: (eventId: number) => void
}

export function MinimapWidget({ events, focusedEventId, onEventClick }: MinimapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const focusedItemRef = useRef<HTMLDivElement>(null)
  const prevEventCountRef = useRef<number>(0)

  // Filter out tool results (they're paired with tool calls)
  const displayEvents = events.filter(
    event => event.eventType !== ConversationEventType.ToolResult
  )

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (containerRef.current && displayEvents.length > prevEventCountRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    prevEventCountRef.current = displayEvents.length
  }, [displayEvents.length])

  // Auto-scroll to keep focused item visible when user clicks
  useEffect(() => {
    if (focusedEventId && focusedItemRef.current && containerRef.current) {
      const container = containerRef.current
      const item = focusedItemRef.current
      const containerRect = container.getBoundingClientRect()
      const itemRect = item.getBoundingClientRect()

      const isVisible =
        itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom

      if (!isVisible) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [focusedEventId])

  if (displayEvents.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4 text-center">
        No events yet
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto min-h-0"
    >
      {displayEvents.map(event => (
        <div
          key={event.id}
          ref={event.id === focusedEventId ? focusedItemRef : undefined}
        >
          <MinimapItem
            event={event}
            isFocused={event.id === focusedEventId}
            onClick={() => onEventClick(event.id)}
          />
        </div>
      ))}
    </div>
  )
}
