import { useState } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Server, LayoutDashboard, Calendar, Database } from "lucide-react";
import BookingForm from "@/components/booking-form";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isHomePage] = useRoute("/");
  const [isBookingsPage] = useRoute("/bookings");
  const [isFundsPage] = useRoute("/funds");

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Server className="text-xl" />
              <h1 className="text-xl font-semibold">Test Environment Manager</h1>
            </div>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/">
              <div className={`flex items-center space-x-1 cursor-pointer px-3 py-1 rounded-md ${isHomePage ? 'bg-primary-dark' : 'hover:bg-primary-dark/50'}`}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </Link>
            <Link href="/bookings">
              <div className={`flex items-center space-x-1 cursor-pointer px-3 py-1 rounded-md ${isBookingsPage ? 'bg-primary-dark' : 'hover:bg-primary-dark/50'}`}>
                <Calendar className="h-4 w-4" />
                <span>Bookings</span>
              </div>
            </Link>
            <Link href="/funds">
              <div className={`flex items-center space-x-1 cursor-pointer px-3 py-1 rounded-md ${isFundsPage ? 'bg-primary-dark' : 'hover:bg-primary-dark/50'}`}>
                <Database className="h-4 w-4" />
                <span>Funds</span>
              </div>
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-primary px-4 py-1 rounded-md shadow hover:bg-gray-100 transition">
                <span className="mr-1">+</span> New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <BookingForm onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
          
          <div className="relative">
            <Bell className="h-5 w-5 cursor-pointer" />
            <span className="absolute -top-1 -right-1 bg-danger text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
          </div>
          
          <div className="w-8 h-8 bg-primary-dark rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">JS</span>
          </div>
        </div>
      </div>
    </header>
  );
}
