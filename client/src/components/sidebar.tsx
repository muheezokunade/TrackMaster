import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  CheckSquare, 
  Columns, 
  Calendar, 
  Users, 
  Settings,
  LogOut,
  Rocket,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

export function Sidebar({ isOpen, onClose, user, onLogout }: SidebarProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, current: location === "/" || location === "/dashboard" },
    { name: "All Tasks", href: "/tasks", icon: CheckSquare, current: location === "/tasks" },
    { name: "Kanban Board", href: "/kanban", icon: Columns, current: location === "/kanban" },
    { name: "Calendar", href: "/calendar", icon: Calendar, current: location === "/calendar" },
    { name: "Team", href: "/team", icon: Users, current: location === "/team" },
  ];

  const priorities = [
    { name: "Critical", color: "bg-red-500", count: 2 },
    { name: "High", color: "bg-orange-500", count: 5 },
    { name: "Medium", color: "bg-yellow-500", count: 8 },
    { name: "Low", color: "bg-green-500", count: 3 },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
      <div className="flex flex-col h-full glassmorphism border-r border-gray-200/50 dark:border-gray-700/50">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Innofy AI
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.current ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    item.current
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={onClose}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Priority Legend */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
            Priority Levels
          </h3>
          <div className="space-y-2">
            {priorities.map((priority) => (
              <div key={priority.name} className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${priority.color} rounded-full`} />
                <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                  {priority.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {priority.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
