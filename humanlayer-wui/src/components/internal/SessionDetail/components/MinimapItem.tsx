import { ConversationEvent, ConversationEventType, ConversationRole } from '@/lib/daemon/types'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatAbsoluteTimestamp, truncate, truncatePath, formatMcpToolName } from '@/utils/formatting'
import {
  Bot,
  User,
  Terminal,
  FileText,
  FilePenLine,
  Search,
  ListTodo,
  Globe,
  List,
  Wrench,
  ListChecks,
  Brain,
} from 'lucide-react'

interface MinimapItemProps {
  event: ConversationEvent
  isFocused: boolean
  isHovered: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

// Type label colors matching the inspiration image
const typeColors = {
  User: 'bg-amber-800/80 text-amber-100',
  Assistant: 'bg-emerald-800/60 text-emerald-100',
  Bash: 'bg-slate-700 text-slate-200',
  Read: 'bg-sky-800/60 text-sky-100',
  Write: 'bg-violet-800/60 text-violet-100',
  Edit: 'bg-violet-800/60 text-violet-100',
  MultiEdit: 'bg-violet-800/60 text-violet-100',
  Grep: 'bg-slate-600 text-slate-200',
  Glob: 'bg-slate-600 text-slate-200',
  LS: 'bg-slate-600 text-slate-200',
  Task: 'bg-indigo-800/60 text-indigo-100',
  TodoWrite: 'bg-amber-700/60 text-amber-100',
  WebSearch: 'bg-teal-800/60 text-teal-100',
  WebFetch: 'bg-teal-800/60 text-teal-100',
  MCP: 'bg-purple-800/60 text-purple-100',
  default: 'bg-slate-700 text-slate-200',
} as const

const typeIcons = {
  User: User,
  Assistant: Bot,
  Thinking: Brain,
  Bash: Terminal,
  BashOutput: Terminal,
  Read: FileText,
  Write: FilePenLine,
  Edit: FilePenLine,
  MultiEdit: FilePenLine,
  NotebookRead: FileText,
  NotebookEdit: FilePenLine,
  Grep: Search,
  Glob: Search,
  LS: List,
  Task: Wrench,
  TodoWrite: ListTodo,
  WebSearch: Globe,
  WebFetch: Globe,
  ExitPlanMode: ListChecks,
  MCP: Globe,
  default: Wrench,
} as const

function getEventType(event: ConversationEvent): string {
  if (event.eventType === ConversationEventType.ToolCall) {
    if (event.toolName?.startsWith('mcp__')) return 'MCP'
    return event.toolName || 'Unknown'
  }
  if (event.role === ConversationRole.User) return 'User'
  if (event.role === ConversationRole.Assistant) {
    if (event.content?.startsWith('<thinking>')) return 'Thinking'
    return 'Assistant'
  }
  return 'Unknown'
}

function getEventPreview(event: ConversationEvent): string {
  if (event.eventType === ConversationEventType.ToolCall) {
    if (!event.toolInputJson) return ''
    try {
      const input = JSON.parse(event.toolInputJson)
      // Return the most relevant field based on tool type
      if (event.toolName === 'Bash') return input.command || input.description || ''
      if (event.toolName === 'Read') return truncatePath(input.file_path, 50)
      if (event.toolName === 'Write') return truncatePath(input.file_path, 50)
      if (event.toolName === 'Edit') return truncatePath(input.file_path, 50)
      if (event.toolName === 'MultiEdit') return truncatePath(input.file_path, 50)
      if (event.toolName === 'Grep') return input.pattern || ''
      if (event.toolName === 'Glob') return input.pattern || ''
      if (event.toolName === 'LS') return truncatePath(input.path, 50)
      if (event.toolName === 'Task') return input.description || ''
      if (event.toolName === 'TodoWrite') return '' // No preview needed
      if (event.toolName === 'WebSearch') return input.query || ''
      if (event.toolName === 'WebFetch') return input.url || ''
      if (event.toolName?.startsWith('mcp__')) {
        return formatMcpToolName(event.toolName)
      }
      // Generic fallback: show first string value
      const firstStringValue = Object.values(input).find(v => typeof v === 'string')
      return typeof firstStringValue === 'string' ? firstStringValue : ''
    } catch {
      return ''
    }
  }
  return event.content || ''
}

export function MinimapItem({ event, isFocused, isHovered, onClick, onMouseEnter, onMouseLeave }: MinimapItemProps) {
  const eventType = getEventType(event)
  const preview = getEventPreview(event)
  const IconComponent = typeIcons[eventType as keyof typeof typeIcons] || typeIcons.default
  const colorClass = typeColors[eventType as keyof typeof typeColors] || typeColors.default

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={cn(
            'w-full flex items-center gap-1.5 px-2 py-1 text-left transition-colors duration-150',
            'border-l-2 hover:bg-muted/50',
            isFocused || isHovered
              ? 'border-l-[var(--terminal-accent)] bg-accent/20'
              : 'border-l-transparent'
          )}
        >
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex-shrink-0',
              colorClass
            )}
          >
            <IconComponent className="w-3 h-3" />
            {eventType}
          </span>
          <span className="flex-1 text-xs text-muted-foreground truncate">
            {truncate(preview, 60)}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[300px]">
        <div className="text-xs">
          <div className="font-medium">{eventType}</div>
          {preview && <div className="text-muted-foreground mt-1 break-words">{truncate(preview, 150)}</div>}
          {event.createdAt && (
            <div className="text-muted-foreground/60 mt-1">
              {formatAbsoluteTimestamp(event.createdAt)}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
