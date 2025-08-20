import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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

interface BagCheckFormProps {
  onAirlineSelect?: (airlineCode: string) => void;
}

export default function BagCheckForm({ onAirlineSelect }: BagCheckFormProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [selectedAirline, setSelectedAirline] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [unit, setUnit] = useState<"in" | "cm">(() => {
    const storedUnit = localStorage.getItem('preferredUnit');
    return (storedUnit === 'cm' || storedUnit === 'in') ? storedUnit : 'in';
  });
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    height: "",
  });
  const [selectedUserBag, setSelectedUserBag] = useState("");
  const [selectedKnownBag, setSelectedKnownBag] = useState("");
  const [isPetCarrier, setIsPetCarrier] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<{
    airline?: string;
    dimensions?: string;
  }>({});

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

  // CACHE BUST: Use correct endpoint with cache-busting in query key only
  const { data: knownBags = [], isLoading: isLoadingKnownBags } = useQuery<KnownBag[]>({
    queryKey: ["/api/bags", "cache-bust-v4"],
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  // DEBUG: Log state for production debugging  
  useEffect(() => {
    console.log('DEBUG - isPetCarrier:', isPetCarrier, 'knownBags.length:', knownBags.length, 'loading:', isLoadingKnownBags);
    if (knownBags.length > 0) {
      console.log('First bag:', knownBags[0]);
      console.log('Pet carrier bags:', knownBags.filter(b => b.isPetCarrier).length);
      console.log('Non-pet carrier bags:', knownBags.filter(b => !b.isPetCarrier).length);
    }
  }, [isPetCarrier, knownBags, isLoadingKnownBags]);

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

  const validateForm = () => {
    const errors: { airline?: string; dimensions?: string } = {};

    // Validate airline selection
    if (!selectedAirline) {
      errors.airline = "Please select an airline";
    }

    // Validate bag dimensions - check if user has either selected a bag OR entered all dimensions
    const hasDimensions = dimensions.length && dimensions.width && dimensions.height;
    const hasSelectedBag = selectedKnownBag || selectedUserBag;
    
    if (!hasDimensions && !hasSelectedBag) {
      errors.dimensions = "Please enter all bag dimensions or select a bag from the dropdown";
    } else if (hasDimensions) {
      // Validate dimension values are positive numbers
      const length = parseFloat(dimensions.length);
      const width = parseFloat(dimensions.width);
      const height = parseFloat(dimensions.height);
      
      if (isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
        errors.dimensions = "All dimensions must be positive numbers";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form and show errors
    if (!validateForm()) {
      return;
    }

    let bagLengthCm, bagWidthCm, bagHeightCm;

    // Convert dimensions to cm for API call
    if (unit === "in") {
      bagLengthCm = inchesToCm(parseFloat(dimensions.length));
      bagWidthCm = inchesToCm(parseFloat(dimensions.width));
      bagHeightCm = inchesToCm(parseFloat(dimensions.height));
    } else {
      bagLengthCm = parseFloat(dimensions.length);
      bagWidthCm = parseFloat(dimensions.width);
      bagHeightCm = parseFloat(dimensions.height);
    }

    // Clear any validation errors on successful submission
    setValidationErrors({});

    // Determine the correct bagId to send
    let bagIdToSend: string | undefined = selectedKnownBag;
    if (selectedUserBag) {
      // For user bags, we need to use the actual bag.id, not the userBag.id
      const userBag = userBags.find((ub: UserBag) => ub.id === selectedUserBag);
      if (!userBag) {
        console.error("User bag not found:", selectedUserBag);
        toast({
          title: "Error",
          description: "Selected bag not found. Please try again.",
          variant: "destructive",
        });
        return;
      }
      bagIdToSend = userBag.bag.id;
    }

    checkBagMutation.mutate({
      airlineIataCode: selectedAirline,
      flightNumber: flightNumber || undefined,
      bagLengthCm: bagLengthCm.toString(),
      bagWidthCm: bagWidthCm.toString(),
      bagHeightCm: bagHeightCm.toString(),
      isPetCarrier,
      bagId: bagIdToSend || undefined,
    });
  };

  const handleKnownBagSelect = (bagId: string) => {
    setSelectedKnownBag(bagId);
    if (bagId) {
      // Fill manual dimensions with selected bag dimensions
      const knownBag = knownBags.find((kb: KnownBag) => kb.id === bagId);
      if (knownBag) {
        const lengthInUnit = unit === "cm" ? parseFloat(knownBag.lengthCm) : cmToInches(parseFloat(knownBag.lengthCm));
        const widthInUnit = unit === "cm" ? parseFloat(knownBag.widthCm) : cmToInches(parseFloat(knownBag.widthCm));
        const heightInUnit = unit === "cm" ? parseFloat(knownBag.heightCm) : cmToInches(parseFloat(knownBag.heightCm));
        
        setDimensions({ 
          length: lengthInUnit.toFixed(1), 
          width: widthInUnit.toFixed(1), 
          height: heightInUnit.toFixed(1) 
        });
        setIsPetCarrier(knownBag.isPetCarrier);
      }
      setSelectedUserBag("");
      // Clear dimension errors when user selects a bag
      if (validationErrors.dimensions) {
        setValidationErrors(prev => ({ ...prev, dimensions: undefined }));
      }
    }
  };

  const handleUserBagSelect = (userBagId: string) => {
    setSelectedUserBag(userBagId);
    if (userBagId) {
      // Fill manual dimensions with selected user bag dimensions
      const userBag = userBags.find((ub: UserBag) => ub.id === userBagId);
      if (userBag) {
        const lengthInUnit = unit === "cm" ? parseFloat(userBag.bag.lengthCm) : cmToInches(parseFloat(userBag.bag.lengthCm));
        const widthInUnit = unit === "cm" ? parseFloat(userBag.bag.widthCm) : cmToInches(parseFloat(userBag.bag.widthCm));
        const heightInUnit = unit === "cm" ? parseFloat(userBag.bag.heightCm) : cmToInches(parseFloat(userBag.bag.heightCm));
        
        setDimensions({ 
          length: lengthInUnit.toFixed(1), 
          width: widthInUnit.toFixed(1), 
          height: heightInUnit.toFixed(1) 
        });
        setIsPetCarrier(userBag.bag.isPetCarrier);
      }
      setSelectedKnownBag("");
      // Clear dimension errors when user selects a bag
      if (validationErrors.dimensions) {
        setValidationErrors(prev => ({ ...prev, dimensions: undefined }));
      }
    }
  };

  const handleManualDimensionChange = (field: string, value: string) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
    // Clear dimension errors when user starts entering values
    if (validationErrors.dimensions && value) {
      setValidationErrors(prev => ({ ...prev, dimensions: undefined }));
    }
  };

  const handleAirlineSelect = (airlineCode: string) => {
    setSelectedAirline(airlineCode);
    if (onAirlineSelect) {
      onAirlineSelect(airlineCode);
    }
    // Clear airline error when user selects
    if (validationErrors.airline) {
      setValidationErrors(prev => ({ ...prev, airline: undefined }));
    }
  };

  const handleUnitChange = (newUnit: "in" | "cm") => {
    // Convert existing dimensions to new unit
    if (dimensions.length || dimensions.width || dimensions.height) {
      const convertValue = (value: string, fromUnit: "in" | "cm", toUnit: "in" | "cm") => {
        if (!value) return "";
        const numValue = parseFloat(value);
        if (fromUnit === "cm" && toUnit === "in") {
          return cmToInches(numValue).toFixed(1);
        } else if (fromUnit === "in" && toUnit === "cm") {
          return inchesToCm(numValue).toFixed(1);
        }
        return value;
      };

      setDimensions(prev => ({
        length: convertValue(prev.length, unit, newUnit),
        width: convertValue(prev.width, unit, newUnit),
        height: convertValue(prev.height, unit, newUnit),
      }));
    }
    setUnit(newUnit);
    // Save user preference to localStorage
    localStorage.setItem('preferredUnit', newUnit);
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
                  <Select value={selectedAirline} onValueChange={handleAirlineSelect} required>
                    <SelectTrigger 
                      data-testid="select-airline"
                      className={validationErrors.airline ? "border-error-red" : ""}
                    >
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
                  {validationErrors.airline && (
                    <p className="text-sm text-error-red mt-1" data-testid="error-airline">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {validationErrors.airline}
                    </p>
                  )}
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
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="knownBag">Select from Popular Bag Models</Label>
                  {selectedKnownBag && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKnownBag("");
                        setDimensions({ length: "", width: "", height: "" });
                        setIsPetCarrier(false);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                      data-testid="button-clear-known-bag"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                <Select value={selectedKnownBag} onValueChange={handleKnownBagSelect}>
                  <SelectTrigger data-testid="select-known-bag">
                    <SelectValue placeholder={(() => {
                      // DEBUG: Log filtering process
                      console.log('Filtering bags - isPetCarrier:', isPetCarrier, 'Total bags:', knownBags.length);
                      let filteredBags: KnownBag[];
                      if (isPetCarrier === true) {
                        filteredBags = knownBags.filter((bag: KnownBag) => bag.isPetCarrier === true);
                      } else {
                        filteredBags = knownBags.slice(); // All bags when not filtering for pet carriers
                      }
                      const count = filteredBags.length;
                      console.log('Filtered bags count:', count);
                      if (count <= 20) {
                        return `Choose from ${count} popular bag models...`;
                      } else {
                        const roundedDown = Math.floor(count / 10) * 10;
                        return `Choose from ${roundedDown}+ popular bag models...`;
                      }
                    })()} />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      console.log('RENDER DEBUG: About to filter bags, knownBags.length:', knownBags.length, 'isPetCarrier:', isPetCarrier);
                      let bagsToShow: KnownBag[];
                      if (isPetCarrier === true) {
                        bagsToShow = knownBags.filter((bag: KnownBag) => bag.isPetCarrier === true);
                        console.log('Showing pet carriers only:', bagsToShow.length);
                      } else {
                        bagsToShow = knownBags.slice(); // Show all bags
                        console.log('Showing all bags:', bagsToShow.length);
                      }
                      return bagsToShow;
                    })()
                      .map((bag: KnownBag) => (
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
              {userBags.length > 0 && isAuthenticated && (
                <>
                  <div className="text-center text-gray-500 text-sm mb-4">or</div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="userBag">Select from My Bags</Label>
                      {selectedUserBag && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserBag("");
                            setDimensions({ length: "", width: "", height: "" });
                            setIsPetCarrier(false);
                          }}
                          className="text-sm text-gray-500 hover:text-gray-700 underline"
                          data-testid="button-clear-user-bag"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
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
                      onClick={() => handleUnitChange("in")}
                      data-testid="button-unit-inches"
                    >
                      Inches
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        unit === "cm" ? "bg-airline-blue text-white" : "text-gray-600 hover:text-gray-800"
                      }`}
                      onClick={() => handleUnitChange("cm")}
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
                    className={`text-center ${validationErrors.dimensions ? "border-error-red" : ""}`}
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
                    className={`text-center ${validationErrors.dimensions ? "border-error-red" : ""}`}
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
                    className={`text-center ${validationErrors.dimensions ? "border-error-red" : ""}`}
                    data-testid="input-height"
                  />
                </div>
              </div>
              {validationErrors.dimensions && (
                <div className="mb-4">
                  <p className="text-sm text-error-red" data-testid="error-dimensions">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {validationErrors.dimensions}
                  </p>
                </div>
              )}
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
