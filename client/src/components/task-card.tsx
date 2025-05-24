import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import type { TaskWithUsers } from "@shared/schema";

interface TaskCardProps {
  task: TaskWithUsers;
  onDragStart: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onDragStart, isDragging }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border-l-red-500';
      case 'HIGH':
        return 'border-l-orange-500';
      case 'MEDIUM':
        return 'border-l-yellow-500';
      case 'LOW':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: string | Date | null) => {
    if (!dueDate || task.status === 'DONE') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Card
      className={`cursor-move hover:shadow-md transition-all duration-200 border-l-4 ${getPriorityBorderColor(task.priority)} ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${task.status === 'DONE' ? 'opacity-75' : ''}`}
      draggable
      onDragStart={onDragStart}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className={`font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight ${
            task.status === 'DONE' ? 'line-through' : ''
          }`}>
            {task.title}
          </h4>
          <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {task.status === 'IN_PROGRESS' && (
          <div className="mb-3">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: '60%' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">60% complete</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {task.dueDate && (
              <div className={`flex items-center space-x-1 ${
                isOverdue(task.dueDate) ? 'text-red-500' : ''
              }`}>
                <Calendar className="w-3 h-3" />
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {task.assignee && (
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-secondary text-white">
                  {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
