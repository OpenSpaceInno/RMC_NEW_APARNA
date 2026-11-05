import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import DeliveryCard from "@/components/customer/DeliveryCard";
import DeliveryDetailsDialog from "@/components/customer/DeliveryDetailsDialog";
import PODViewer from "@/components/customer/PODViewer";
import InvoiceViewer from "@/components/customer/InvoiceViewer";
import MessageCenter from "@/components/customer/MessageCenter";
import { CustomerDelivery } from "@/types/customer";
import { Package, FileText, MessageSquare, TrendingUp } from "lucide-react";

const CustomerPortal = () => {
  const { deliveries, messages, loading, getPOD, getInvoice, createMessage, replyToMessage, resolveMessage } = useCustomerPortal();
  const [selectedDelivery, setSelectedDelivery] = useState<CustomerDelivery | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [currentPOD, setCurrentPOD] = useState<ReturnType<typeof getPOD>>(null);
  const [currentInvoice, setCurrentInvoice] = useState<ReturnType<typeof getInvoice>>(null);

  const handleViewDetails = (delivery: CustomerDelivery) => {
    setSelectedDelivery(delivery);
    setDetailsOpen(true);
  };

  const handleViewPOD = (deliveryId: string) => {
    const pod = getPOD(deliveryId);
    setCurrentPOD(pod);
    setPodOpen(true);
  };

  const handleViewInvoice = (deliveryId: string) => {
    const invoice = getInvoice(deliveryId);
    setCurrentInvoice(invoice);
    setInvoiceOpen(true);
  };

  const stats = {
    active: deliveries.filter(d => d.status === 'in_transit' || d.status === 'dispatched').length,
    completed: deliveries.filter(d => d.status === 'delivered').length,
    pending: deliveries.filter(d => d.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Package className="h-12 w-12 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customer Portal</h1>
        <p className="text-muted-foreground">Track deliveries, view PODs, and manage communications</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Deliveries</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deliveries" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deliveries" className="gap-2">
            <Package className="h-4 w-4" />
            My Deliveries
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
            {messages.filter(m => m.status === 'open' || m.status === 'in_progress').length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {messages.filter(m => m.status === 'open' || m.status === 'in_progress').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onViewDetails={handleViewDetails}
                onViewPOD={handleViewPOD}
                onViewInvoice={handleViewInvoice}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <MessageCenter 
            messages={messages} 
            onCreateMessage={createMessage}
            onReplyMessage={replyToMessage}
            onResolveMessage={resolveMessage}
          />
        </TabsContent>
      </Tabs>

      <DeliveryDetailsDialog
        delivery={selectedDelivery}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <PODViewer
        pod={currentPOD}
        open={podOpen}
        onOpenChange={setPodOpen}
      />

      <InvoiceViewer
        invoice={currentInvoice}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
    </div>
  );
};

export default CustomerPortal;
