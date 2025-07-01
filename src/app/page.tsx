import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, MessageCircle, Building2, Users, Clock } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Browse and manage courses across all departments with detailed information.',
    },
    {
      icon: Calendar,
      title: 'Schedule Viewing',
      description: 'View detailed schedules for all courses with time, venue, and type information.',
    },
    {
      icon: Building2,
      title: 'Department Overview',
      description: 'Explore departments and their course offerings in an organized manner.',
    },
    {
      icon: MessageCircle,
      title: 'Complaint System',
      description: 'Submit and track complaints with a transparent status system.',
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Admin tools for managing users and verification codes.',
    },
    {
      icon: Clock,
      title: 'Real-time Updates',
      description: 'Get instant updates on schedule changes and important notifications.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            CourseFlow
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your academic rhythm, perfectly timed
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Streamline your academic experience with our comprehensive course management system.
            View schedules, browse courses, and stay organized throughout your academic journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button asChild size="lg">
              <Link href="/courses">Browse Courses</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/schedule">View Schedule</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage your academic life in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join CourseFlow today and take control of your academic schedule
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/auth/register">Sign Up Now</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 CourseFlow. All rights reserved.</p>
            <p className="mt-2">Your academic rhythm, perfectly timed.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
