import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

// Define the validation schema for fund creation
const fundFormSchema = z.object({
  name: z.string().min(2, { message: 'Fund name must be at least 2 characters.' }),
  code: z.string().min(2, { message: 'Fund code must be at least 2 characters.' }),
  description: z.string().optional(),
  projects: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

type FundFormValues = z.infer<typeof fundFormSchema>;

// Type definition for fund
type Fund = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  projects: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export default function FundManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<Fund | null>(null);
  
  const queryClient = useQueryClient();

  // Query for fetching all funds
  const { data: funds = [], isLoading } = useQuery({
    queryKey: ['/api/funds'],
    queryFn: () => apiRequest<Fund[]>('/api/funds'),
  });

  // Generate test funds mutation
  const generateTestFundsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/funds/generate-test-data', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funds'] });
      toast({
        title: 'Test Funds Generated',
        description: 'Test funds have been successfully generated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to generate test funds.',
        variant: 'destructive',
      });
    },
  });

  // Create new fund mutation
  const createFundMutation = useMutation({
    mutationFn: async (newFund: FundFormValues) => {
      return apiRequest('/api/funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFund),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funds'] });
      setIsDialogOpen(false);
      toast({
        title: 'Fund Created',
        description: 'The fund has been successfully created.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create the fund.',
        variant: 'destructive',
      });
    },
  });

  // Update fund mutation
  const updateFundMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FundFormValues> }) => {
      return apiRequest(`/api/funds/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funds'] });
      setIsDialogOpen(false);
      setSelectedFund(null);
      toast({
        title: 'Fund Updated',
        description: 'The fund has been successfully updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update the fund.',
        variant: 'destructive',
      });
    },
  });

  // Delete fund mutation
  const deleteFundMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/funds/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funds'] });
      setDeleteDialogOpen(false);
      setFundToDelete(null);
      toast({
        title: 'Fund Deleted',
        description: 'The fund has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete the fund.',
        variant: 'destructive',
      });
    },
  });

  // Form setup
  const form = useForm<FundFormValues>({
    resolver: zodResolver(fundFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      projects: '',
      status: 'active',
    },
  });

  // Open dialog for fund creation
  const openCreateDialog = () => {
    form.reset({
      name: '',
      code: '',
      description: '',
      projects: '',
      status: 'active',
    });
    setSelectedFund(null);
    setIsDialogOpen(true);
  };

  // Open dialog for fund editing
  const openEditDialog = (fund: Fund) => {
    form.reset({
      name: fund.name,
      code: fund.code,
      description: fund.description || '',
      projects: fund.projects || '',
      status: fund.status,
    });
    setSelectedFund(fund);
    setIsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (values: FundFormValues) => {
    if (selectedFund) {
      updateFundMutation.mutate({
        id: selectedFund.id,
        data: values,
      });
    } else {
      createFundMutation.mutate(values);
    }
  };

  // Handle delete confirmation
  const confirmDelete = (fund: Fund) => {
    setFundToDelete(fund);
    setDeleteDialogOpen(true);
  };

  // Filter funds by status and search term
  const filteredFunds = funds.filter(fund => {
    const matchesStatus = filterStatus === 'all' || fund.status === filterStatus;
    const matchesSearch = 
      searchTerm === '' || 
      fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fund.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fund.description && fund.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fund.projects && fund.projects.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Fund Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generateTestFundsMutation.mutate()} disabled={generateTestFundsMutation.isPending}>
              {generateTestFundsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Test Funds'
              )}
            </Button>
            <Button onClick={openCreateDialog}>Add New Fund</Button>
          </div>
        </div>

        <div className="flex justify-between items-center my-4">
          <div className="flex items-center gap-2">
            <Tabs defaultValue="all" className="w-[400px]" onValueChange={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search funds..."
              className="w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fund List</CardTitle>
            <CardDescription>Manage your testing funds</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableCaption>A list of all available funds.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund Name</TableHead>
                    <TableHead>Fund Code</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFunds.length > 0 ? (
                    filteredFunds.map((fund) => (
                      <TableRow key={fund.id}>
                        <TableCell className="font-medium">{fund.name}</TableCell>
                        <TableCell>{fund.code}</TableCell>
                        <TableCell>{fund.projects}</TableCell>
                        <TableCell>
                          <Badge variant={fund.status === 'active' ? 'default' : 'secondary'}>
                            {fund.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(fund)}>
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => confirmDelete(fund)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No funds found. {searchTerm ? 'Try a different search term.' : 'Add a new fund to get started.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Fund Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedFund ? 'Edit Fund' : 'Create New Fund'}</DialogTitle>
            <DialogDescription>
              {selectedFund 
                ? 'Update the fund details below.'
                : 'Enter the details for the new fund.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter fund name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter fund code" 
                        {...field} 
                        disabled={!!selectedFund} // Disable editing code for existing funds
                      />
                    </FormControl>
                    {!!selectedFund && (
                      <FormDescription>
                        Fund code cannot be modified after creation.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter fund description" 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projects</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter projects associated with this fund (comma separated)" 
                        className="resize-none" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      List projects that use this fund, separated by commas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Mark this fund as active or inactive.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value === 'active'} 
                        onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createFundMutation.isPending || updateFundMutation.isPending}
                >
                  {(createFundMutation.isPending || updateFundMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedFund ? 'Update Fund' : 'Create Fund'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the fund 
              <span className="font-semibold"> {fundToDelete?.name}</span> with code 
              <span className="font-semibold"> {fundToDelete?.code}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fundToDelete && deleteFundMutation.mutate(fundToDelete.id)}
              disabled={deleteFundMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFundMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}