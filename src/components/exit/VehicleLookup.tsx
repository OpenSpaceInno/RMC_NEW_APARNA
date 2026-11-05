import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Truck, Clock, Package } from "lucide-react";
import { format } from "date-fns";

interface ActiveVehicle {
  regNo: string;
  tripId: string;
  entryTime: string;
  loadingWeight: number;
  entryWeight: number;
  material: string;
  destination: string;
}

interface VehicleLookupProps {
  onSelectVehicle: (vehicle: ActiveVehicle) => void;
}

// Mock data for vehicles that have entered and loaded but not exited
const mockActiveVehicles: ActiveVehicle[] = [
  {
    regNo: "MH12AB1234",
    tripId: "TRIP-001",
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    entryWeight: 8500,
    loadingWeight: 17800,
    material: "M25 Grade Concrete",
    destination: "Site Alpha",
  },
  {
    regNo: "MH14CD5678",
    tripId: "TRIP-002",
    entryTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    entryWeight: 9200,
    loadingWeight: 18500,
    material: "M30 Grade Concrete",
    destination: "Site Beta",
  },
  {
    regNo: "GJ05EF9012",
    tripId: "TRIP-003",
    entryTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    entryWeight: 8800,
    loadingWeight: 17200,
    material: "M20 Grade Concrete",
    destination: "Site Gamma",
  },
  {
    regNo: "DL08GH3456",
    tripId: "TRIP-004",
    entryTime: new Date(Date.now() - 0.5 * 60 * 60 * 1000).toISOString(),
    entryWeight: 9500,
    loadingWeight: 19100,
    material: "M40 Grade Concrete",
    destination: "Site Delta",
  },
];

const VehicleLookup = ({ onSelectVehicle }: VehicleLookupProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return mockActiveVehicles;
    const term = searchTerm.toUpperCase();
    return mockActiveVehicles.filter(
      (v) =>
        v.regNo.includes(term) ||
        v.tripId.toLowerCase().includes(term.toLowerCase()) ||
        v.destination.toLowerCase().includes(term.toLowerCase())
    );
  }, [searchTerm]);

  const formatWeight = (weight: number) => (weight / 1000).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Vehicle Lookup
        </CardTitle>
        <CardDescription>
          Select a vehicle that has completed loading and is ready to exit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search Vehicle / Trip / Destination</Label>
          <Input
            id="search"
            placeholder="e.g., MH12AB1234 or TRIP-001"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
          />
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredVehicles.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No vehicles found matching "{searchTerm}"
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.tripId}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectVehicle(vehicle)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="font-bold text-lg">{vehicle.regNo}</span>
                      <Badge variant="outline">{vehicle.tripId}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Entry: {format(new Date(vehicle.entryTime), "HH:mm")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {vehicle.material}
                      </span>
                    </div>
                    <div className="text-sm">
                      Destination: <span className="font-medium">{vehicle.destination}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-xs text-muted-foreground">Loaded Weight</div>
                    <div className="font-bold text-primary text-lg">
                      {formatWeight(vehicle.loadingWeight)} t
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tare: {formatWeight(vehicle.entryWeight)} t
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVehicle(vehicle);
                  }}
                >
                  Start Exit Verification
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleLookup;
