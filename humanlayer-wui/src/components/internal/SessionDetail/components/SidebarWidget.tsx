import { useState } from 'react'
import { ConversationEvent } from '@/lib/daemon/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MinimapWidget } from './MinimapWidget'
import { TodoWidget } from './TodoWidget'

interface SidebarWidgetProps {
  events: ConversationEvent[]
  lastTodoEvent: ConversationEvent | undefined
  focusedEventId: number | null
  onEventClick: (eventId: number) => void
}

export function SidebarWidget({
  events,
  lastTodoEvent,
  focusedEventId,
  onEventClick,
}: SidebarWidgetProps) {
  const [activeTab, setActiveTab] = useState<'minimap' | 'todos'>('minimap')

  return (
    <Tabs
      value={activeTab}
      onValueChange={value => setActiveTab(value as 'minimap' | 'todos')}
      className="flex flex-col flex-1 min-h-0"
    >
      <TabsList className="w-full flex-shrink-0">
        <TabsTrigger value="minimap" className="flex-1">
          Minimap
        </TabsTrigger>
        <TabsTrigger value="todos" className="flex-1">
          TODOs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="minimap" className="flex-1 min-h-0 mt-2 flex flex-col overflow-hidden">
        <MinimapWidget
          events={events}
          focusedEventId={focusedEventId}
          onEventClick={onEventClick}
        />
      </TabsContent>

      <TabsContent value="todos" className="flex-1 min-h-0 mt-2 flex flex-col overflow-hidden">
        {lastTodoEvent ? (
          <TodoWidget event={lastTodoEvent} />
        ) : (
          <div className="text-muted-foreground text-sm py-4 text-center">
            No tasks yet
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
