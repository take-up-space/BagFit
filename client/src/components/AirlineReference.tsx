import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import VerificationBadge from "./ui/verification-badge";

interface Airline {
  id: string;
  name: string;
  iataCode: string;
  maxPersonalItemLengthCm: string;
  maxPersonalItemWidthCm: string;
  maxPersonalItemHeightCm: string;
  verificationStatus: string;
  petCarrierAllowed: boolean;
  lastVerifiedDate: string;
  sourceUrl?: string;
}

function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 100) / 100;
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

export default function AirlineReference() {
  const { data: airlines, isLoading } = useQuery({
    queryKey: ["/api/airlines"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-4xl text-airline-blue mb-4"></i>
            <p className="text-gray-600">Loading airline data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-6">
          <CardTitle className="text-2xl text-gray-900 flex items-center">
            <i className="fas fa-table text-airline-blue mr-2"></i>
            Airline Underseat Dimensions Reference
          </CardTitle>
          <div className="flex items-center space-x-2">
            <VerificationBadge status="VERIFIED_OFFICIAL" />
            <VerificationBadge status="UNVERIFIED_CONSERVATIVE" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Airline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensions (inches)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pet Carrier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {airlines?.map((airline: Airline) => (
                <tr 
                  key={airline.id} 
                  className={`hover:bg-gray-50 ${
                    airline.verificationStatus === 'UNVERIFIED_CONSERVATIVE' ? 'bg-orange-50' : ''
                  }`}
                  data-testid={`row-airline-${airline.iataCode}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${getAirlineLogoColor(airline.iataCode)} rounded-full flex items-center justify-center text-white text-xs font-bold mr-3`}>
                        {airline.iataCode}
                      </div>
                      <span className="font-medium text-gray-900" data-testid={`text-airline-name-${airline.iataCode}`}>
                        {airline.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-dimensions-${airline.iataCode}`}>
                    {cmToInches(parseFloat(airline.maxPersonalItemLengthCm))} × {cmToInches(parseFloat(airline.maxPersonalItemWidthCm))} × {cmToInches(parseFloat(airline.maxPersonalItemHeightCm))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <VerificationBadge status={airline.verificationStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {airline.petCarrierAllowed ? (
                      <span className="text-success-green" data-testid={`text-pet-allowed-${airline.iataCode}`}>
                        <i className="fas fa-check mr-1"></i>Allowed
                      </span>
                    ) : (
                      <span className="text-error-red" data-testid={`text-pet-not-allowed-${airline.iataCode}`}>
                        <i className="fas fa-times mr-1"></i>Not Allowed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid={`text-last-updated-${airline.iataCode}`}>
                    {new Date(airline.lastVerifiedDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <i className="fas fa-exclamation-triangle text-warning-orange mt-0.5"></i>
            <div>
              <p className="font-medium text-yellow-800 mb-1">Important Notice</p>
              <p className="text-sm text-yellow-700">
                Always verify dimensions with your specific airline before traveling. Policies can change, and some aircraft may have different underseat dimensions. When in doubt, contact the airline directly or check their official website.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
