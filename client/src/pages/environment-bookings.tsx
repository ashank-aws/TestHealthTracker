import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingTable from "@/components/booking-table";
import BookingForm from "@/components/booking-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function EnvironmentBookings() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("current");

  // Fetch active bookings
  const { data: activeBookings, isLoading: activeLoading } = useQuery({
    queryKey: ["/api/bookings?status=active"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch scheduled bookings
  const { data: scheduledBookings, isLoading: scheduledLoading } = useQuery({
    queryKey: ["/api/bookings?status=scheduled"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch completed bookings
  const { data: completedBookings, isLoading: completedLoading } = useQuery({
    queryKey: ["/api/bookings?status=completed"],
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-gray-800">Environment Booking System</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h3 className="text-gray-800 text-xl font-semibold">Manage Bookings</h3>
          <div className="mt-2 md:mt-0">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary-dark">
                  <span className="mr-1">+</span> New Booking
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <BookingForm onClose={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="current">Current Bookings</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          <TabsContent value="current">
            <BookingTable 
              bookings={activeBookings || []} 
              isLoading={activeLoading} 
              showPagination={true}
            />
          </TabsContent>
          <TabsContent value="upcoming">
            <BookingTable 
              bookings={scheduledBookings || []} 
              isLoading={scheduledLoading} 
              showPagination={true}
            />
          </TabsContent>
          <TabsContent value="past">
            <BookingTable 
              bookings={completedBookings || []} 
              isLoading={completedLoading} 
              showPagination={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
