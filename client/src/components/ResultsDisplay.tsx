import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import VerificationBadge from "./ui/verification-badge";

interface ResultsDisplayProps {
  result: {
    fitsUnderSeat: boolean;
    exceedsIn: string[];
    isPetCarrier: boolean;
    airline: {
      name: string;
      iataCode: string;
      verificationStatus: string;
      sourceUrl?: string;
      maxPersonalItemLengthCm: string;
      maxPersonalItemWidthCm: string;
      maxPersonalItemHeightCm: string;
      petCarrierAllowed: boolean;
      petCarrierMaxLengthCm?: string;
      petCarrierMaxWidthCm?: string;
      petCarrierMaxHeightCm?: string;
    };
    bagDimensions: {
      lengthCm: number;
      widthCm: number;
      heightCm: number;
      lengthIn: number;
      widthIn: number;
      heightIn: number;
    };
    bagCheckId?: string;
  };
}

function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 100) / 100;
}

export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveBagMutation = useMutation({
    mutationFn: async () => {
      // Create bag and add to user collection
      const bagResponse = await apiRequest("POST", "/api/bags", {
        brand: "Custom",
        model: "Manual Entry",
        lengthCm: result.bagDimensions.lengthCm,
        widthCm: result.bagDimensions.widthCm,
        heightCm: result.bagDimensions.heightCm,
        isPetCarrier: false,
      });
      
      const bag = await bagResponse.json();
      
      const userBagResponse = await apiRequest("POST", "/api/user/bags", {
        bagId: bag.id,
        customName: `${result.bagDimensions.lengthIn}×${result.bagDimensions.widthIn}×${result.bagDimensions.heightIn}" Bag`,
      });
      
      return await userBagResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/bags"] });
      toast({
        title: "Success",
        description: "Bag saved to your collection!",
      });
    },
    onError: (error) => {
      console.error("Save bag error:", error);
      toast({
        title: "Error",
        description: "Failed to save bag. You might need to log in first.",
        variant: "destructive",
      });
    },
  });

  const shareResult = () => {
    const shareText = `My ${result.bagDimensions.lengthIn}×${result.bagDimensions.widthIn}×${result.bagDimensions.heightIn}" bag ${result.fitsUnderSeat ? 'fits' : 'does not fit'} under the seat on ${result.airline.name}. Check yours at ${window.location.origin}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'BagFit Result',
        text: shareText,
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Link Copied",
        description: "Result copied to clipboard!",
      });
    }
  };

  return (
    <>
    <Card className="mb-8" data-testid="card-results">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            result.fitsUnderSeat ? 'bg-success-green' : 'bg-error-red'
          }`}>
            <i className={`fas ${result.fitsUnderSeat ? 'fa-check' : 'fa-times'} text-white text-2xl`}></i>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${
            result.fitsUnderSeat ? 'text-success-green' : 'text-error-red'
          }`} data-testid="text-result-status">
            {result.fitsUnderSeat ? '✓ Your Bag Fits!' : 
             (result.exceedsIn.includes('Pet carriers not allowed') ? '✗ Pet Carriers Not Allowed' : '✗ Bag Too Large')}
          </h2>
          <p className="text-gray-600" data-testid="text-result-description">
            {result.fitsUnderSeat 
              ? `Your bag meets ${result.airline.name} underseat requirements`
              : (result.exceedsIn.includes('Pet carriers not allowed') 
                  ? `${result.airline.name} does not allow pet carriers in the cabin`
                  : `Your bag exceeds ${result.isPetCarrier ? 'pet carrier' : ''} limits in: ${result.exceedsIn.join(', ')}`
                )
            }
          </p>
        </div>

        {/* Dimension Comparison */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Dimension Comparison</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Your Bag</h4>
              <div className="space-y-2">
                <div className="flex justify-between" data-testid="text-your-bag-length">
                  <span>Length:</span>
                  <span className="font-medium">{result.bagDimensions.lengthIn}" ({result.bagDimensions.lengthCm.toFixed(1)}cm)</span>
                </div>
                <div className="flex justify-between" data-testid="text-your-bag-width">
                  <span>Width:</span>
                  <span className="font-medium">{result.bagDimensions.widthIn}" ({result.bagDimensions.widthCm.toFixed(1)}cm)</span>
                </div>
                <div className="flex justify-between" data-testid="text-your-bag-height">
                  <span>Height:</span>
                  <span className="font-medium">{result.bagDimensions.heightIn}" ({result.bagDimensions.heightCm.toFixed(1)}cm)</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                {result.isPetCarrier && result.airline.petCarrierMaxLengthCm && (
                  parseFloat(result.airline.petCarrierMaxLengthCm) !== parseFloat(result.airline.maxPersonalItemLengthCm) ||
                  parseFloat(result.airline.petCarrierMaxWidthCm || '0') !== parseFloat(result.airline.maxPersonalItemWidthCm) ||
                  parseFloat(result.airline.petCarrierMaxHeightCm || '0') !== parseFloat(result.airline.maxPersonalItemHeightCm)
                ) ? 'Pet Carrier Limit' : 'Airline Limit'}
                <span className="ml-2">
                  <VerificationBadge status={result.airline.verificationStatus} />
                </span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between" data-testid="text-airline-limit-length">
                  <span>Length:</span>
                  <span className={`font-medium ${
                    result.bagDimensions.lengthCm <= parseFloat(
                      result.isPetCarrier && result.airline.petCarrierMaxLengthCm 
                        ? result.airline.petCarrierMaxLengthCm 
                        : result.airline.maxPersonalItemLengthCm
                    ) ? 'text-success-green' : 'text-error-red'
                  }`}>
                    {result.isPetCarrier && result.airline.petCarrierMaxLengthCm ? 
                      `${cmToInches(parseFloat(result.airline.petCarrierMaxLengthCm))}" (${parseFloat(result.airline.petCarrierMaxLengthCm).toFixed(1)}cm)` :
                      `${cmToInches(parseFloat(result.airline.maxPersonalItemLengthCm))}" (${parseFloat(result.airline.maxPersonalItemLengthCm).toFixed(1)}cm)`
                    }
                  </span>
                </div>
                <div className="flex justify-between" data-testid="text-airline-limit-width">
                  <span>Width:</span>
                  <span className={`font-medium ${
                    result.bagDimensions.widthCm <= parseFloat(
                      result.isPetCarrier && result.airline.petCarrierMaxWidthCm 
                        ? result.airline.petCarrierMaxWidthCm 
                        : result.airline.maxPersonalItemWidthCm
                    ) ? 'text-success-green' : 'text-error-red'
                  }`}>
                    {result.isPetCarrier && result.airline.petCarrierMaxWidthCm ? 
                      `${cmToInches(parseFloat(result.airline.petCarrierMaxWidthCm))}" (${parseFloat(result.airline.petCarrierMaxWidthCm).toFixed(1)}cm)` :
                      `${cmToInches(parseFloat(result.airline.maxPersonalItemWidthCm))}" (${parseFloat(result.airline.maxPersonalItemWidthCm).toFixed(1)}cm)`
                    }
                  </span>
                </div>
                <div className="flex justify-between" data-testid="text-airline-limit-height">
                  <span>Height:</span>
                  <span className={`font-medium ${
                    result.bagDimensions.heightCm <= parseFloat(
                      result.isPetCarrier && result.airline.petCarrierMaxHeightCm 
                        ? result.airline.petCarrierMaxHeightCm 
                        : result.airline.maxPersonalItemHeightCm
                    ) ? 'text-success-green' : 'text-error-red'
                  }`}>
                    {result.isPetCarrier && result.airline.petCarrierMaxHeightCm ? 
                      `${cmToInches(parseFloat(result.airline.petCarrierMaxHeightCm))}" (${parseFloat(result.airline.petCarrierMaxHeightCm).toFixed(1)}cm)` :
                      `${cmToInches(parseFloat(result.airline.maxPersonalItemHeightCm))}" (${parseFloat(result.airline.maxPersonalItemHeightCm).toFixed(1)}cm)`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Warning */}
        {result.airline.verificationStatus === 'UNVERIFIED_CONSERVATIVE' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <i className="fas fa-exclamation-triangle text-warning-orange mt-0.5"></i>
              <div>
                <p className="font-medium text-orange-800 mb-1">Unverified Dimensions</p>
                <p className="text-sm text-orange-700">
                  These dimensions are conservative estimates. Please verify with {result.airline.name} directly before traveling.
                  {result.airline.sourceUrl && (
                    <>
                      {" "}
                      <a 
                        href={result.airline.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                        data-testid="link-airline-policy"
                      >
                        Check official policy
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => saveBagMutation.mutate()}
            disabled={saveBagMutation.isPending}
            className="flex-1 bg-airline-blue text-white hover:bg-blue-700"
            data-testid="button-save-bag"
          >
            {saveBagMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save to My Bags
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={shareResult}
            className="flex-1 border-airline-blue text-airline-blue hover:bg-blue-50"
            data-testid="button-share"
          >
            <i className="fas fa-share-alt mr-2"></i>
            Share Result
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Data Verification Status Panel */}
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg text-gray-900 flex items-center">
          <i className="fas fa-shield-alt text-verified-blue mr-2"></i>
          Data Verification Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          result.airline.verificationStatus === 'VERIFIED_OFFICIAL' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-8 h-8 ${getAirlineLogoColor(result.airline.iataCode)} rounded-full flex items-center justify-center text-white text-xs font-bold mr-3`}>
              {result.airline.iataCode}
            </div>
            <span className="font-medium text-gray-800">
              {result.airline.name}
            </span>
          </div>
          <VerificationBadge status={result.airline.verificationStatus} />
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>Verified</strong> dimensions come from official airline sources. 
            <strong> Unverified</strong> data uses conservative estimates.
          </p>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

// Helper function for airline logo colors
function getAirlineLogoColor(iataCode: string): string {
  const colors: { [key: string]: string } = {
    'AA': 'bg-red-600',
    'DL': 'bg-blue-600',
    'UA': 'bg-blue-800',
    'AS': 'bg-green-700',
    'B6': 'bg-blue-500',
    'F9': 'bg-green-600',
    'NK': 'bg-yellow-500',
    'WN': 'bg-red-500',
    'EI': 'bg-green-600',
    'AC': 'bg-red-700',
    'AF': 'bg-blue-700',
    'NH': 'bg-blue-900',
    'AV': 'bg-red-600',
    'BA': 'bg-blue-800',
    'LH': 'bg-yellow-600',
    'IB': 'bg-red-600',
    'KL': 'bg-blue-600',
    'LX': 'bg-red-700',
    'OS': 'bg-red-600',
    'TK': 'bg-red-700',
    'VS': 'bg-red-500',
    'EK': 'bg-red-600',
    'QR': 'bg-purple-700',
    'SG': 'bg-blue-800',
    'CX': 'bg-green-700',
    'JL': 'bg-red-600',
    'SQ': 'bg-blue-800',
    'TG': 'bg-purple-600',
    'QF': 'bg-red-600',
    'NZ': 'bg-black',
    'FJ': 'bg-blue-600',
    'VN': 'bg-yellow-600',
  };
  return colors[iataCode] || 'bg-gray-600';
}
