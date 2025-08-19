import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VerificationBadge from "./ui/verification-badge";

interface Airline {
  id: string;
  name: string;
  iataCode: string;
  verificationStatus: string;
}

function getAirlineLogoColor(iataCode: string): string {
  const colors: { [key: string]: string } = {
    'AA': 'bg-red-600',
    'UA': 'bg-blue-800', 
    'WN': 'bg-blue-900',
    'DL': 'bg-red-700',
    'B6': 'bg-blue-600',
    'F9': 'bg-green-600',
  };
  return colors[iataCode] || 'bg-gray-600';
}

interface SidebarProps {
  selectedAirlineCode?: string;
}

export default function Sidebar({ selectedAirlineCode }: SidebarProps = {}) {
  const { data: airlines } = useQuery({
    queryKey: ["/api/airlines"],
    retry: false,
  });

  // Filter airlines for verification status section
  const airlinesToShow = selectedAirlineCode 
    ? (airlines as Airline[])?.filter((airline: Airline) => airline.iataCode === selectedAirlineCode) || []
    : (airlines as Airline[])?.slice(0, 6) || [];

  return (
    <div className="space-y-8">
      
      {/* Verification Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <i className="fas fa-shield-alt text-verified-blue mr-2"></i>
            Data Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {airlinesToShow.map((airline: Airline) => (
              <div 
                key={airline.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  airline.verificationStatus === 'VERIFIED_OFFICIAL' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}
                data-testid={`status-card-${airline.iataCode}`}
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${getAirlineLogoColor(airline.iataCode)} rounded-full flex items-center justify-center text-white text-xs font-bold mr-3`}>
                    {airline.iataCode}
                  </div>
                  <span className="font-medium text-gray-800" data-testid={`text-airline-name-sidebar-${airline.iataCode}`}>
                    {airline.name}
                  </span>
                </div>
                <VerificationBadge status={airline.verificationStatus} />
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <i className="fas fa-info-circle mr-2"></i>
              <strong>Verified</strong> dimensions come from official airline sources. 
              <strong> Unverified</strong> data uses conservative estimates.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Popular Underseat Bags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <i className="fas fa-star text-warning-orange mr-2"></i>
            Popular Underseat Bags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Professional backpack */}
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <img 
                src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80" 
                alt="Professional laptop backpack" 
                className="rounded-lg w-12 h-12 object-cover" 
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">Travel Pro Backpack</p>
                <p className="text-sm text-gray-500">17" × 13" × 8"</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-warning-orange text-xs">
                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                  </div>
                  <span className="text-xs text-gray-500 ml-1">(847)</span>
                </div>
              </div>
            </div>

            {/* Rolling underseat luggage */}
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <img 
                src="https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80" 
                alt="Rolling underseat luggage" 
                className="rounded-lg w-12 h-12 object-cover" 
              />
              <div className="flex-1">
                <p className="font-medium text-gray-800">Wheeled Underseat</p>
                <p className="text-sm text-gray-500">18" × 14" × 8"</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-warning-orange text-xs">
                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star-half-alt"></i>
                  </div>
                  <span className="text-xs text-gray-500 ml-1">(623)</span>
                </div>
              </div>
            </div>

            {/* Compact duffel */}
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <div className="rounded-lg w-12 h-12 bg-gray-200 flex items-center justify-center">
                <i className="fas fa-suitcase text-gray-500"></i>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Compact Duffel</p>
                <p className="text-sm text-gray-500">16" × 12" × 6"</p>
                <div className="flex items-center mt-1">
                  <div className="flex text-warning-orange text-xs">
                    <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="far fa-star"></i>
                  </div>
                  <span className="text-xs text-gray-500 ml-1">(392)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <i className="fas fa-lightbulb text-warning-orange mr-2"></i>
            Travel Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <i className="fas fa-check-circle text-success-green mt-0.5"></i>
              <p className="text-sm text-gray-700">Measure your bag when fully packed - soft bags expand significantly</p>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-check-circle text-success-green mt-0.5"></i>
              <p className="text-sm text-gray-700">Consider wheels and handles in total dimensions</p>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-check-circle text-success-green mt-0.5"></i>
              <p className="text-sm text-gray-700">Pack heavier items in your underseat bag for easier access</p>
            </div>
            <div className="flex items-start space-x-3">
              <i className="fas fa-check-circle text-success-green mt-0.5"></i>
              <p className="text-sm text-gray-700">Some airlines are stricter than others - when in doubt, go smaller</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
