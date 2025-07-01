'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  BookOpen,
  Calendar,
  MessageCircle,
  Settings,
  User,
  LogOut,
  Menu,
  Home,
  Building2,
  GraduationCap,
  ClipboardList,
  Users,
} from 'lucide-react'

export function Navigation() {
  const { user, logout, isAuthenticated, isAdmin, isLecturer } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      show: isAuthenticated,
    },
    {
      title: 'Courses',
      href: '/courses',
      icon: BookOpen,
      show: true,
    },
    {
      title: 'Schedule',
      href: '/schedule',
      icon: Calendar,
      show: true,
    },
    {
      title: 'Departments',
      href: '/departments',
      icon: Building2,
      show: true,
    },
    {
      title: 'Complaints',
      href: '/complaints',
      icon: MessageCircle,
      show: isAuthenticated,
    },
  ]

  const adminItems = [
    {
      title: 'Users',
      href: '/admin/users',
      icon: Users,
      show: isAdmin,
    },
    {
      title: 'Verification Codes',
      href: '/admin/verification-codes',
      icon: ClipboardList,
      show: isAdmin,
    },
  ]

  const MobileNavigation = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6" />
              <span className="text-xl font-bold">CourseFlow</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-3 mt-6">
          {navItems.filter(item => item.show).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}

          {(isAdmin || isLecturer) && (
            <>
              <div className="border-t pt-3">
                <p className="px-3 text-sm font-medium text-muted-foreground mb-2">
                  {isAdmin ? 'Admin' : 'Lecturer'}
                </p>
                {adminItems.filter(item => item.show).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {isAuthenticated && (
            <div className="border-t pt-3">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {user?.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start px-3"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6" />
            <span className="text-xl font-bold">CourseFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}

            {(isAdmin || isLecturer) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    {isAdmin ? 'Admin' : 'Lecturer'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {adminItems.filter(item => item.show).map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center">
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <Badge variant="secondary" className="text-xs w-fit">
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-2 hidden md:flex">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </div>
      </div>
    </header>
  )
}
