import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import airplaneSeatIcon from "@assets/AirplaneChair_Icon_1755563723564.png";

interface UserBag {
  id: string;
  customName: string;
  createdAt: string;
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

function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 100) / 100;
}

function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 100) / 100;
}

export default function MyBags() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  // Get unit preference from localStorage (set by BagCheckForm)
  const [unit, setUnit] = useState<"in" | "cm">(() => {
    const storedUnit = localStorage.getItem('preferredUnit');
    return (storedUnit === 'cm' || storedUnit === 'in') ? storedUnit : 'in';
  });
  const [formData, setFormData] = useState({
    customName: "",
    brand: "",
    model: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    isPetCarrier: false,
  });
  const [editingBagId, setEditingBagId] = useState<string | null>(null);
  const [editingBagName, setEditingBagName] = useState("");
  const [editingBagIsPetCarrier, setEditingBagIsPetCarrier] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: userBags, isLoading } = useQuery({
    queryKey: ["/api/user/bags"],
    retry: false,
    enabled: isAuthenticated,
  });

  const addBagMutation = useMutation({
    mutationFn: async (bagData: any) => {
      // Convert dimensions to cm if needed
      let lengthCm = parseFloat(bagData.lengthCm);
      let widthCm = parseFloat(bagData.widthCm);
      let heightCm = parseFloat(bagData.heightCm);
      
      if (unit === "in") {
        lengthCm = inchesToCm(lengthCm);
        widthCm = inchesToCm(widthCm);
        heightCm = inchesToCm(heightCm);
      }

      // First create the bag
      const bagResponse = await apiRequest("POST", "/api/bags", {
        brand: bagData.brand,
        model: bagData.model,
        lengthCm,
        widthCm,
        heightCm,
        isPetCarrier: bagData.isPetCarrier,
        isVerified: false,
      });
      
      const bag = await bagResponse.json();
      
      // Then add it to user's collection
      const userBagResponse = await apiRequest("POST", "/api/user/bags", {
        bagId: bag.id,
        customName: bagData.customName,
      });
      
      return await userBagResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/bags"] });
      setShowAddForm(false);
      setUnit("in");
      setFormData({
        customName: "",
        brand: "",
        model: "",
        lengthCm: "",
        widthCm: "",
        heightCm: "",
        isPetCarrier: false,
      });
      toast({
        title: "Success",
        description: "Bag added to your collection!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add bag. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeBagMutation = useMutation({
    mutationFn: async (bagId: string) => {
      await apiRequest("DELETE", `/api/user/bags/${bagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/bags"] });
      toast({
        title: "Success",
        description: "Bag removed from your collection.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove bag. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBagNameMutation = useMutation({
    mutationFn: async ({ userBagId, customName, isPetCarrier }: { userBagId: string; customName?: string; isPetCarrier?: boolean }) => {
      // SAFETY CHECK: Do not proceed with empty/invalid data
      if (!userBagId || (customName === undefined && isPetCarrier === undefined)) {
        throw new Error("Invalid mutation parameters");
      }
      
      const updateData: any = {};
      
      // Include customName if provided
      if (customName !== undefined) {
        updateData.customName = customName;
      }
      
      // Include isPetCarrier if provided  
      if (isPetCarrier !== undefined) {
        updateData.isPetCarrier = isPetCarrier;
      }
      
      const response = await apiRequest("PATCH", `/api/user/bags/${userBagId}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/bags"] });
      setEditingBagId(null);
      setEditingBagName("");
      setEditingBagIsPetCarrier(false);
      toast({
        title: "Success",
        description: "Bag name updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update bag name. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditBagName = (userBag: UserBag) => {
    setEditingBagId(userBag.id);
    setEditingBagName(userBag.customName);
    // Use user's personal preference if set, otherwise default to bag's isPetCarrier
    const userBagWithPetCarrier = userBag as any; // Type assertion for new field
    setEditingBagIsPetCarrier(userBagWithPetCarrier.isPetCarrier !== null ? userBagWithPetCarrier.isPetCarrier : userBag.bag.isPetCarrier);
  };

  const handleSaveBagName = () => {
    if (editingBagId) {
      // Fix: Send the data fields directly, not wrapped in mutation params
      const updateFields: any = {};
      
      // Always include isPetCarrier since it's a boolean state
      updateFields.isPetCarrier = editingBagIsPetCarrier;
      
      // Include customName if it has content
      if (editingBagName && editingBagName.trim()) {
        updateFields.customName = editingBagName.trim();
      }
      

      
      updateBagNameMutation.mutate({
        userBagId: editingBagId,
        customName: updateFields.customName,
        isPetCarrier: updateFields.isPetCarrier
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingBagId(null);
    setEditingBagName("");
    setEditingBagIsPetCarrier(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customName || !formData.brand || !formData.model || 
        !formData.lengthCm || !formData.widthCm || !formData.heightCm) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addBagMutation.mutate(formData);
  };

  const handleUnitChange = (newUnit: "in" | "cm") => {
    // Convert existing dimensions to new unit
    if (formData.lengthCm || formData.widthCm || formData.heightCm) {
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

      setFormData(prev => ({
        ...prev,
        lengthCm: convertValue(prev.lengthCm, unit, newUnit),
        widthCm: convertValue(prev.widthCm, unit, newUnit),
        heightCm: convertValue(prev.heightCm, unit, newUnit),
      }));
    }
    setUnit(newUnit);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-airline-blue mb-4"></i>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-airline-blue flex items-center">
                <img 
                  src={airplaneSeatIcon} 
                  alt="Airplane seat" 
                  className="w-6 h-6 mr-1"
                />
                BagFit
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/home"
                className="text-gray-600 hover:text-airline-blue transition-colors"
                data-testid="link-home"
              >
                <i className="fas fa-home mr-1"></i>Home
              </Link>
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                    data-testid="img-profile"
                  />
                )}
                <span className="text-gray-700" data-testid="text-username">
                  {user?.firstName || user?.email || 'User'}
                </span>
              </div>
              <a 
                href="/api/logout"
                className="text-gray-600 hover:text-red-600 transition-colors"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt mr-1"></i>Logout
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bags</h1>
            <p className="text-gray-600 mt-2">Manage your saved bag collection</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-airline-blue hover:bg-blue-700"
            data-testid="button-add-bag"
          >
            <i className="fas fa-plus mr-2"></i>Add New Bag
          </Button>
        </div>

        {/* Add Bag Form */}
        {showAddForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Add New Bag
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  data-testid="button-cancel-add"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customName">Custom Name *</Label>
                    <Input
                      id="customName"
                      value={formData.customName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                      placeholder="My Travel Backpack"
                      data-testid="input-custom-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Samsonite"
                      data-testid="input-brand"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Winfield 3"
                      data-testid="input-model"
                    />
                  </div>
                </div>

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
                        data-testid="button-unit-inches-mybags"
                      >
                        Inches
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          unit === "cm" ? "bg-airline-blue text-white" : "text-gray-600 hover:text-gray-800"
                        }`}
                        onClick={() => handleUnitChange("cm")}
                        data-testid="button-unit-cm-mybags"
                      >
                        CM
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="lengthCm">Length ({unit}) *</Label>
                    <Input
                      id="lengthCm"
                      type="number"
                      step="0.1"
                      value={formData.lengthCm}
                      onChange={(e) => setFormData(prev => ({ ...prev, lengthCm: e.target.value }))}
                      placeholder={unit === "in" ? "18.0" : "45.0"}
                      data-testid="input-length"
                    />
                  </div>
                  <div>
                    <Label htmlFor="widthCm">Width ({unit}) *</Label>
                    <Input
                      id="widthCm"
                      type="number"
                      step="0.1"
                      value={formData.widthCm}
                      onChange={(e) => setFormData(prev => ({ ...prev, widthCm: e.target.value }))}
                      placeholder={unit === "in" ? "14.0" : "35.0"}
                      data-testid="input-width"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heightCm">Height ({unit}) *</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      step="0.1"
                      value={formData.heightCm}
                      onChange={(e) => setFormData(prev => ({ ...prev, heightCm: e.target.value }))}
                      placeholder={unit === "in" ? "8.0" : "20.0"}
                      data-testid="input-height"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPetCarrier"
                    checked={formData.isPetCarrier}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPetCarrier: e.target.checked }))}
                    data-testid="input-pet-carrier"
                  />
                  <Label htmlFor="isPetCarrier">This is a pet carrier</Label>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={addBagMutation.isPending}
                    className="bg-airline-blue hover:bg-blue-700"
                    data-testid="button-save-bag"
                  >
                    {addBagMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Add Bag
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bags Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-4xl text-airline-blue mb-4"></i>
            <p className="text-gray-600">Loading your bags...</p>
          </div>
        ) : !userBags || (userBags as UserBag[]).length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <i className="fas fa-suitcase text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No bags saved yet</h3>
              <p className="text-gray-600 mb-6">Add your first bag to start building your collection</p>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-airline-blue hover:bg-blue-700"
                data-testid="button-add-first-bag"
              >
                <i className="fas fa-plus mr-2"></i>Add Your First Bag
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(userBags as UserBag[]).map((userBag: UserBag) => (
              <Card key={userBag.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    {editingBagId === userBag.id ? (
                      <div className="flex flex-col space-y-2 flex-1">
                        <Input
                          value={editingBagName}
                          onChange={(e) => setEditingBagName(e.target.value)}
                          className="text-lg font-semibold"
                          data-testid={`input-edit-bag-name-${userBag.id}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveBagName();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleCancelEdit();
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`pet-carrier-${userBag.id}`}
                            checked={editingBagIsPetCarrier}
                            onChange={(e) => setEditingBagIsPetCarrier(e.target.checked)}
                            className="h-4 w-4 text-airline-blue focus:ring-airline-blue border-gray-300 rounded"
                            data-testid={`checkbox-pet-carrier-${userBag.id}`}
                          />
                          <Label htmlFor={`pet-carrier-${userBag.id}`} className="text-sm text-gray-700">
                            Pet Carrier?
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveBagName}
                          disabled={updateBagNameMutation.isPending}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          data-testid={`button-save-name-${userBag.id}`}
                        >
                          <i className="fas fa-check"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          data-testid={`button-cancel-edit-${userBag.id}`}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle 
                          className="text-lg cursor-pointer hover:text-airline-blue" 
                          data-testid={`text-bag-name-${userBag.id}`}
                          onClick={() => handleEditBagName(userBag)}
                          title="Click to edit bag name"
                        >
                          {userBag.customName}
                        </CardTitle>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log("=== EDIT BUTTON CLICKED ===", userBag.id);
                              handleEditBagName(userBag);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            data-testid={`button-edit-${userBag.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBagMutation.mutate(userBag.bag.id)}
                            disabled={removeBagMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-remove-${userBag.id}`}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600" data-testid={`text-bag-brand-${userBag.id}`}>
                    {userBag.bag.brand} {userBag.bag.model}
                  </p>
                  {((userBag as any).isPetCarrier !== null ? (userBag as any).isPetCarrier : userBag.bag.isPetCarrier) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                      <i className="fas fa-paw mr-1"></i>Pet Carrier
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center">
                        {unit === "cm" ? (
                          <>
                            <div className="font-medium text-gray-900" data-testid={`text-length-${userBag.id}`}>
                              {parseFloat(userBag.bag.lengthCm).toFixed(1)}cm
                            </div>
                            <div className="text-xs text-gray-400">
                              {cmToInches(parseFloat(userBag.bag.lengthCm))}"
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-gray-900" data-testid={`text-length-${userBag.id}`}>
                              {cmToInches(parseFloat(userBag.bag.lengthCm))}"
                            </div>
                            <div className="text-xs text-gray-400">
                              {parseFloat(userBag.bag.lengthCm).toFixed(1)}cm
                            </div>
                          </>
                        )}
                        <div className="text-xs text-gray-400">Length</div>
                      </div>
                      <div className="text-center">
                        {unit === "cm" ? (
                          <>
                            <div className="font-medium text-gray-900" data-testid={`text-width-${userBag.id}`}>
                              {parseFloat(userBag.bag.widthCm).toFixed(1)}cm
                            </div>
                            <div className="text-xs text-gray-400">
                              {cmToInches(parseFloat(userBag.bag.widthCm))}"
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-gray-900" data-testid={`text-width-${userBag.id}`}>
                              {cmToInches(parseFloat(userBag.bag.widthCm))}"
                            </div>
                            <div className="text-xs text-gray-400">
                              {parseFloat(userBag.bag.widthCm).toFixed(1)}cm
                            </div>
                          </>
                        )}
                        <div className="text-xs text-gray-400">Width</div>
                      </div>
                      <div className="text-center">
                        {unit === "cm" ? (
                          <>
                            <div className="font-medium text-gray-900" data-testid={`text-height-${userBag.id}`}>
                              {parseFloat(userBag.bag.heightCm).toFixed(1)}cm
                            </div>
                            <div className="text-xs text-gray-400">
                              {cmToInches(parseFloat(userBag.bag.heightCm))}"
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-gray-900" data-testid={`text-height-${userBag.id}`}>
                              {cmToInches(parseFloat(userBag.bag.heightCm))}"
                            </div>
                            <div className="text-xs text-gray-400">
                              {parseFloat(userBag.bag.heightCm).toFixed(1)}cm
                            </div>
                          </>
                        )}
                        <div className="text-xs text-gray-400">Height</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Added {new Date(userBag.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
