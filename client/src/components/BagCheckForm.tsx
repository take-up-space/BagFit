import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ResultsDisplay from "./ResultsDisplay";

interface Airline {
  id: string;
  name: string;
  iataCode: string;
  verificationStatus: string;
}

interface UserBag {
  id: string;
  customName: string;
  bag: {
    id: string;
    brand: string;
    model: string;
    lengthCm: string;
    widthCm: string;
    heightCm: string;
    isPetCarrier: boolean;
  };
}

interface KnownBag {
  id: string;
  brand: string;
  model: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  isPetCarrier: boolean;
  isVerified: boolean;
}

function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 100) / 100;
}

function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 100) / 100;
}

export default function BagCheckForm() {
  const { toast } = useToast();
  const [selectedAirline, setSelectedAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    height: "",
  });
  const [selectedUserBag, setSelectedUserBag] = useState("");
  const [selectedKnownBag, setSelectedKnownBag] = useState("");
  const [isPetCarrier, setIsPetCarrier] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  // Fetch airlines
  const { data: airlines = [] } = useQuery<Airline[]>({
    queryKey: ["/api/airlines"],
    retry: false,
  });

  // Fetch user bags (optional, only if authenticated)
  const { data: userBags = [] } = useQuery<UserBag[]>({
    queryKey: ["/api/user/bags"],
    retry: false,
    meta: { on401: "returnNull" },
  });

  // Fetch all known bags from database
  const { data: knownBags = [] } = useQuery<KnownBag[]>({
    queryKey: ["/api/bags"],
    retry: false,
  });

  // Bag check mutation
  const checkBagMutation = useMutation({
    mutationFn: async (checkData: any) => {
      const response = await apiRequest("POST", "/api/bag-check", checkData);
      return await response.json();
    },
    onSuccess: (result) => {
      setCheckResult(result);
      toast({
        title: result.fitsUnderSeat ? "✓ Your Bag Fits!" : "✗ Bag Too Large",
        description: result.fitsUnderSeat 
          ? "Your bag meets the airline's underseat requirements"
          : `Exceeds limits in: ${result.exceedsIn.join(", ")}`,
        variant: result.fitsUnderSeat ? "default" : "destructive",
      });
    },
    onError: (error) => {
      console.error("Bag check error:", error);
      toast({
        title: "Error",
        description: "Failed to check bag. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAirline) {
      toast({
        title: "Error",
        description: "Please select an airline.",
        variant: "destructive",
      });
      return;
    }

    let bagLengthCm, bagWidthCm, bagHeightCm;

    if (selectedKnownBag) {
      // Use selected known bag dimensions
      const knownBag = knownBags.find((kb: KnownBag) => kb.id === selectedKnownBag);
      if (!knownBag) {
        toast({
          title: "Error",
          description: "Selected bag not found.",
          variant: "destructive",
        });
        return;
      }
      bagLengthCm = parseFloat(knownBag.lengthCm);
      bagWidthCm = parseFloat(knownBag.widthCm);
      bagHeightCm = parseFloat(knownBag.heightCm);
      setIsPetCarrier(knownBag.isPetCarrier);
    } else if (selectedUserBag) {
      // Use selected user bag dimensions
      const userBag = userBags.find((ub: UserBag) => ub.id === selectedUserBag);
      if (!userBag) {
        toast({
          title: "Error",
          description: "Selected bag not found.",
          variant: "destructive",
        });
        return;
      }
      bagLengthCm = parseFloat(userBag.bag.lengthCm);
      bagWidthCm = parseFloat(userBag.bag.widthCm);
      bagHeightCm = parseFloat(userBag.bag.heightCm);
      setIsPetCarrier(userBag.bag.isPetCarrier);
    } else {
      // Use manual dimensions
      if (!dimensions.length || !dimensions.width || !dimensions.height) {
        toast({
          title: "Error",
          description: "Please enter all bag dimensions.",
          variant: "destructive",
        });
        return;
      }

      const length = parseFloat(dimensions.length);
      const width = parseFloat(dimensions.width);
      const height = parseFloat(dimensions.height);

      if (unit === "in") {
        bagLengthCm = inchesToCm(length);
        bagWidthCm = inchesToCm(width);
        bagHeightCm = inchesToCm(height);
      } else {
        bagLengthCm = length;
        bagWidthCm = width;
        bagHeightCm = height;
      }
    }

    checkBagMutation.mutate({
      airlineIataCode: selectedAirline,
      flightNumber: flightNumber || undefined,
      bagLengthCm,
      bagWidthCm,
      bagHeightCm,
      isPetCarrier,
      bagId: selectedKnownBag || selectedUserBag || undefined,
    });
  };

  const handleKnownBagSelect = (bagId: string) => {
    setSelectedKnownBag(bagId);
    if (bagId) {
      // Clear manual dimensions and user bag selection when selecting known bag
      setDimensions({ length: "", width: "", height: "" });
      setSelectedUserBag("");
    }
  };

  const handleUserBagSelect = (bagId: string) => {
    setSelectedUserBag(bagId);
    if (bagId) {
      // Clear manual dimensions and known bag selection when selecting a saved bag
      setDimensions({ length: "", width: "", height: "" });
      setSelectedKnownBag("");
    }
  };

  const handleManualDimensionChange = (field: string, value: string) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
    if (value) {
      // Clear selected bags when entering manual dimensions
      setSelectedUserBag("");
      setSelectedKnownBag("");
    }
  };

  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">
            Check Your Bag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Step 1: Airline Selection */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span className="bg-airline-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">1</span>
                Select Your Airline
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="airline">Airline *</Label>
                  <Select value={selectedAirline} onValueChange={setSelectedAirline} required>
                    <SelectTrigger data-testid="select-airline">
                      <SelectValue placeholder="Choose airline..." />
                    </SelectTrigger>
                    <SelectContent>
                      {airlines.map((airline: Airline) => (
                        <SelectItem key={airline.id} value={airline.iataCode} data-testid={`option-airline-${airline.iataCode}`}>
                          {airline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="flightNumber">Flight Number (optional)</Label>
                  <Input
                    id="flightNumber"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="AA123"
                    data-testid="input-flight-number"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Bag Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span className="bg-airline-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">2</span>
                Choose Your Bag
              </h3>
              
              {/* Select from Known Bags Database */}
              <div className="mb-6">
                <Label htmlFor="knownBag">Select from Popular Bag Models</Label>
                <Select value={selectedKnownBag} onValueChange={handleKnownBagSelect}>
                  <SelectTrigger data-testid="select-known-bag">
                    <SelectValue placeholder="Choose from 80+ popular bag models..." />
                  </SelectTrigger>
                  <SelectContent>
                    {knownBags.map((bag: KnownBag) => (
                      <SelectItem key={bag.id} value={bag.id} data-testid={`option-known-bag-${bag.id}`}>
                        <div className="flex items-center justify-between w-full">
                          <span>{bag.brand} {bag.model}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({cmToInches(parseFloat(bag.lengthCm))}×{cmToInches(parseFloat(bag.widthCm))}×{cmToInches(parseFloat(bag.heightCm))}")
                            {bag.isVerified && <span className="text-verified-blue ml-1">✓</span>}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Alternative: Select from My Bags */}
              {userBags.length > 0 && (
                <>
                  <div className="text-center text-gray-500 text-sm mb-4">or</div>
                  <div className="mb-6">
                    <Label htmlFor="userBag">Select from My Bags</Label>
                    <Select value={selectedUserBag} onValueChange={handleUserBagSelect}>
                      <SelectTrigger data-testid="select-user-bag">
                        <SelectValue placeholder="Select from My Bags..." />
                      </SelectTrigger>
                      <SelectContent>
                        {userBags.map((userBag: UserBag) => (
                          <SelectItem key={userBag.id} value={userBag.id} data-testid={`option-user-bag-${userBag.id}`}>
                            {userBag.customName} ({cmToInches(parseFloat(userBag.bag.lengthCm))}×{cmToInches(parseFloat(userBag.bag.widthCm))}×{cmToInches(parseFloat(userBag.bag.heightCm))}")
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="text-center text-gray-500 text-sm mb-4">or enter manually</div>
              
              {/* Unit Toggle */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Units:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        unit === "in" ? "bg-airline-blue text-white" : "text-gray-600 hover:text-gray-800"
                      }`}
                      onClick={() => setUnit("in")}
                      data-testid="button-unit-inches"
                    >
                      Inches
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        unit === "cm" ? "bg-airline-blue text-white" : "text-gray-600 hover:text-gray-800"
                      }`}
                      onClick={() => setUnit("cm")}
                      data-testid="button-unit-cm"
                    >
                      CM
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="petCarrier" 
                    checked={isPetCarrier}
                    onChange={(e) => setIsPetCarrier(e.target.checked)}
                    className="mr-2"
                    data-testid="input-pet-carrier"
                  />
                  <Label htmlFor="petCarrier" className="text-sm text-gray-700">Pet carrier?</Label>
                </div>
              </div>

              {/* Manual Dimensions */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="length">Length ({unit})</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={dimensions.length}
                    onChange={(e) => handleManualDimensionChange("length", e.target.value)}
                    placeholder={unit === "in" ? "18" : "45.7"}
                    className="text-center"
                    data-testid="input-length"
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width ({unit})</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={dimensions.width}
                    onChange={(e) => handleManualDimensionChange("width", e.target.value)}
                    placeholder={unit === "in" ? "14" : "35.6"}
                    className="text-center"
                    data-testid="input-width"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height ({unit})</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={dimensions.height}
                    onChange={(e) => handleManualDimensionChange("height", e.target.value)}
                    placeholder={unit === "in" ? "8" : "20.3"}
                    className="text-center"
                    data-testid="input-height"
                  />
                </div>
              </div>
            </div>

            {/* Check Button */}
            <Button 
              type="submit"
              disabled={checkBagMutation.isPending}
              className="w-full bg-airline-blue text-white py-4 text-lg font-medium hover:bg-blue-700 transition-colors"
              data-testid="button-check-bag"
            >
              {checkBagMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Checking...
                </>
              ) : (
                <>
                  <i className="fas fa-search mr-2"></i>
                  Check if Bag Fits
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Display */}
      {checkResult && (
        <ResultsDisplay result={checkResult} />
      )}
    </div>
  );
}
