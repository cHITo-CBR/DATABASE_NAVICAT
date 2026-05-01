
import { getAppointments } from "@/app/actions/appointments";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function SalesmanVisitsPage() {
  const session = await getSession();
  const appointments = await getAppointments(session?.user.id);

  // Filter for today
  const today = new Date().toDateString();
  const todayVisits = appointments.filter((a: any) => new Date(a.scheduled_at).toDateString() === today);
  const upcomingVisits = appointments.filter((a: any) => new Date(a.scheduled_at).toDateString() !== today && a.status === 'pending');

  return (
    <div className="space-y-6 pb-20">
      <div className="px-1">
        <h1 className="text-2xl font-bold text-[#1E293B]">My Schedule</h1>
        <p className="text-sm text-muted-foreground">Today's route and upcoming appointments.</p>
      </div>

      {/* Today's Section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">Today's Route</h2>
        {todayVisits.length === 0 ? (
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No visits scheduled for today.
            </CardContent>
          </Card>
        ) : (
          todayVisits.map((visit: any) => (
            <Link key={visit.id} href={`/salesman/visits/${visit.id}`}>
              <Card className="hover:border-primary/50 transition-colors mb-3">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                      <span className="text-[10px] font-bold">
                        {new Date(visit.scheduled_at).getHours()}:{new Date(visit.scheduled_at).getMinutes().toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{visit.customer_name}</h3>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>View on Map</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </section>

      {/* Upcoming Section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">Upcoming</h2>
        {upcomingVisits.map((visit: any) => (
          <div key={visit.id} className="flex items-start gap-4 p-3 rounded-lg border bg-white shadow-sm">
             <div className="min-w-[60px] text-center">
                <div className="text-xs font-bold text-primary">{new Date(visit.scheduled_at).toLocaleString('default', { month: 'short' })}</div>
                <div className="text-xl font-bold">{new Date(visit.scheduled_at).getDate()}</div>
             </div>
             <div className="flex-1">
                <h4 className="font-semibold text-sm">{visit.customer_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                   <Badge variant="outline" className="text-[10px] py-0">{visit.appointment_type}</Badge>
                   <span className="text-xs text-muted-foreground">{visit.status}</span>
                </div>
             </div>
          </div>
        ))}
      </section>
    </div>
  );
}
