"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Phone, User, Calendar, FileText } from "lucide-react";

type Application = {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  bio: string | null;
  profileImage: string;
  status: string;
  leaderId: number | null;
  createdAt: string;
  updatedAt: string;
};

type Leader = {
  id: number;
  name: string | null;
  role: string | null;
  avatar: string;
  status: string;
  position: number;
};

export default function AdminPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [appsRes, leadersRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/leaders')
      ]);

      if (!appsRes.ok || !leadersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const appsData = await appsRes.json();
      const leadersData = await leadersRes.json();

      setApplications(appsData);
      setLeaders(leadersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filled = leaders.filter(l => l.status === 'filled').length;
  const total = 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[rgba(255,255,255,0.6)] bg-[rgba(255,255,255,0.6)] border-b border-[rgba(255,255,255,0.3)]">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-extrabold tracking-wide" style={{ fontFamily: "Cinzel, serif" }}>
            <span className="glow-text-gold">MEP</span> <span className="glow-text-blue">2026</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge className="bg-[color:var(--gold)] text-black">{filled}/{total} filled</Badge>
            <Link href="/">
              <Button variant="outline" className="glass-button border-[rgba(51,51,51,0.2)] text-[#333333]">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "Cinzel, serif", color: '#333333' }}>
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2" style={{ color: '#555555' }}>
            Manage MEP 2026 applications and leader slots
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.3)] backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: '#333333' }}>{applications.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.3)] backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filled Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{filled}/{total}</div>
            </CardContent>
          </Card>
          <Card className="bg-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.3)] backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{total - filled}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card className="bg-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.3)] backdrop-blur-md">
          <CardHeader>
            <CardTitle style={{ fontFamily: "Cinzel, serif", color: '#333333' }}>Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-2 text-muted-foreground">Loading...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No applications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const leader = leaders.find(l => l.id === app.leaderId);
                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white/50 hover:bg-white/70 transition"
                    >
                      <div className="flex items-start gap-4">
                        {/* Profile Image */}
                        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-lg flex-shrink-0">
                          <img
                            src={app.profileImage}
                            alt={app.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h3 className="font-semibold text-lg" style={{ color: '#333333' }}>
                                {app.name}
                              </h3>
                              {leader && (
                                <Badge className="bg-[color:var(--gold)] text-black mt-1">
                                  {leader.role} - Position {leader.position}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="flex-shrink-0">
                              {app.status}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail size={14} />
                              <a href={`mailto:${app.email}`} className="hover:underline">
                                {app.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone size={14} />
                              <a href={`https://wa.me/${app.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:underline">
                                {app.whatsapp}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar size={14} />
                              <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                            </div>
                            {app.bio && (
                              <div className="flex items-start gap-2 text-muted-foreground mt-2">
                                <FileText size={14} className="mt-0.5" />
                                <p className="text-sm">{app.bio}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leader Slots Overview */}
        <Card className="bg-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.3)] backdrop-blur-md mt-8">
          <CardHeader>
            <CardTitle style={{ fontFamily: "Cinzel, serif", color: '#333333' }}>Leader Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaders.map((leader) => (
                <div
                  key={leader.id}
                  className={`p-4 rounded-lg border-2 ${
                    leader.status === 'filled'
                      ? 'border-green-300 bg-green-50/50'
                      : 'border-gray-300 bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow">
                      <img
                        src={leader.avatar}
                        alt={leader.name ?? `Position ${leader.position}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: '#333333' }}>
                        {leader.name ?? `Position ${leader.position}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {leader.role ?? (leader.position <= 3 ? 'Leader' : 'Co-Leader')}
                      </div>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${
                          leader.status === 'filled'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                      >
                        {leader.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-[rgba(255,255,255,0.6)] backdrop-blur mt-16">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2025 MEP — Admin Dashboard</p>
          <div className="text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
