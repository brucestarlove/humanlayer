import { ConversationEvent } from '@/lib/daemon/types'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MinimapWidget } from './MinimapWidget'
import { TodoWidget } from './TodoWidget'

interface SidebarWidgetProps {
  events: ConversationEvent[]
  lastTodoEvent: ConversationEvent | undefined
  focusedEventId: number | null
  hoveredEventId: number | null
  onEventClick: (eventId: number) => void
  onEventHover: (eventId: number | null) => void
  activeTab: 'minimap' | 'todos'
  onTabChange: (tab: 'minimap' | 'todos') => void
}

export function SidebarWidget({
  events,
  lastTodoEvent,
  focusedEventId,
  hoveredEventId,
  onEventClick,
  onEventHover,
  activeTab,
  onTabChange,
}: SidebarWidgetProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={value => onTabChange(value as 'minimap' | 'todos')}
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

      <TabsContent value="minimap" className="flex-1 min-h-0 mt-1 flex flex-col overflow-hidden">
        <MinimapWidget
          events={events}
          focusedEventId={focusedEventId}
          hoveredEventId={hoveredEventId}
          onEventClick={onEventClick}
          onEventHover={onEventHover}
        />
      </TabsContent>

      <TabsContent value="todos" className="flex-1 min-h-0 mt-1 flex flex-col overflow-hidden">
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
