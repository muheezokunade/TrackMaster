import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";
import { Plus, Filter } from "lucide-react";
import type { TaskWithUsers } from "@shared/schema";

interface KanbanBoardProps {
  tasks: TaskWithUsers[];
  isLoading: boolean;
}

export function KanbanBoard({ tasks, isLoading }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<TaskWithUsers | null>(null);

  const todoTasks = tasks.filter(task => task.status === 'TODO');
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(task => task.status === 'DONE');

  const columns = [
    {
      id: 'TODO',
      title: 'To Do',
      tasks: todoTasks,
      bgColor: 'bg-gray-50 dark:bg-gray-800/50',
      indicatorColor: 'bg-gray-400',
      badgeColor: 'bg-gray-200 dark:bg-gray-700'
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      tasks: inProgressTasks,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      indicatorColor: 'bg-blue-400',
      badgeColor: 'bg-blue-200 dark:bg-blue-800'
    },
    {
      id: 'DONE',
      title: 'Done',
      tasks: doneTasks,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      indicatorColor: 'bg-green-400',
      badgeColor: 'bg-green-200 dark:bg-green-800'
    }
  ];

  const handleDragStart = (e: React.DragEvent, task: TaskWithUsers) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      // Here you would call the API to update the task status
      console.log(`Moving task ${draggedTask.id} to ${newStatus}`);
      // updateTask(draggedTask.id, { status: newStatus });
    }
    setDraggedTask(null);
  };

  if (isLoading) {
    return (
      <Card className="glassmorphism">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="space-y-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Task Board
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-primary to-secondary"
              onClick={() => {
                // Trigger the task modal from parent component
                const event = new CustomEvent('openTaskModal');
                window.dispatchEvent(event);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`${column.bgColor} rounded-xl p-4 min-h-[400px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <div className={`w-3 h-3 ${column.indicatorColor} rounded-full mr-2`} />
                {column.title}
                <Badge
                  variant="secondary"
                  className={`ml-auto ${column.badgeColor} text-xs px-2 py-1`}
                >
                  {column.tasks.length}
                </Badge>
              </h3>

              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={(e) => handleDragStart(e, task)}
                    isDragging={draggedTask?.id === task.id}
                  />
                ))}
                
                {column.tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Plus className="w-6 h-6" />
                    </div>
                    <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
