import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Booking = {
  id: number;
  environmentId: number;
  teamId: number;
  userId: number;
  startDate: string;
  endDate: string;
  purpose: string;
  configuration: string;
  status: string;
  team?: {
    id: number;
    name: string;
    abbreviation?: string;
  };
  environment?: {
    id: number;
    name: string;
  };
};

type BookingTableProps = {
  bookings: Booking[];
  isLoading: boolean;
  title?: string;
  showPagination?: boolean;
};

export default function BookingTable({ 
  bookings, 
  isLoading, 
  title = "Bookings",
  showPagination = false
}: BookingTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const itemsPerPage = 5;

  // Calculate pagination values
  const totalItems = bookings?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentBookings = bookings?.slice(startIndex, endIndex) || [];

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/bookings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Booking deleted",
        description: "The booking has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle delete booking action
  const handleDeleteBooking = () => {
    if (selectedBooking) {
      deleteBookingMutation.mutate(selectedBooking.id);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setDeleteDialogOpen(true);
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-light text-success-dark";
      case "scheduled":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-light text-primary";
      case "completed":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800";
      case "cancelled":
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-danger-light text-danger";
      default:
        return "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800";
    }
  };

  // Get team avatar background class
  const getTeamAvatarBg = (index: number) => {
    const colors = ["bg-primary", "bg-warning", "bg-primary-dark", "bg-success"];
    return colors[index % colors.length];
  };

  return (
    <>
      <Card>
        <CardContent className="p-5">
          {title && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h3 className="text-gray-800 text-xl font-semibold">{title}</h3>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(null).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No bookings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showPagination ? currentBookings : bookings).map((booking, index) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 ${getTeamAvatarBg(index)} rounded-full flex items-center justify-center text-white`}>
                              <span className="text-sm">{booking.team?.abbreviation || booking.team?.name?.substring(0, 2) || "TM"}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{booking.team?.name || "Unknown Team"}</div>
                              <div className="text-sm text-gray-500">User ID: {booking.userId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{booking.environment?.name || `Environment ${booking.environmentId}`}</div>
                          <div className="text-sm text-gray-500">{booking.configuration}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(booking.startDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(booking.endDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span className={getStatusBadge(booking.status)}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-600 hover:text-gray-900" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4 text-gray-600 hover:text-gray-900" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openDeleteDialog(booking)}
                            >
                              <Trash2 className="h-4 w-4 text-danger hover:text-danger-dark" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {showPagination && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">{endIndex}</span> of{" "}
                    <span className="font-medium">{totalItems}</span> bookings
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={i}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBooking} disabled={deleteBookingMutation.isPending}>
              {deleteBookingMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
