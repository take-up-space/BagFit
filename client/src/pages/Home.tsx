import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import BagCheckForm from "@/components/BagCheckForm";
import Sidebar from "@/components/Sidebar";
import AirlineReference from "@/components/AirlineReference";
import airplaneSeatIcon from "@assets/AirplaneChair_Icon.png";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedAirlineCode, setSelectedAirlineCode] = useState<string>("");

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
                  alt="Pet Carrier" 
                  className="w-6 h-6 mr-1"
                />
                BagFit
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/my-bags"
                    className="text-gray-600 hover:text-airline-blue transition-colors"
                    data-testid="link-my-bags"
                  >
                    <i className="fas fa-suitcase mr-1"></i>My Bags
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
                </>
              ) : (
                <>
                  <Link 
                    href="/home"
                    className="text-gray-600 hover:text-airline-blue transition-colors"
                    data-testid="link-home"
                  >
                    <i className="fas fa-home mr-1"></i>Home
                  </Link>
                  <a 
                    href="/api/login"
                    className="bg-airline-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    data-testid="button-login"
                  >
                    <i className="fas fa-user mr-1"></i>Login
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Will My Bag Fit?
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">Check if your personal item will fit under the seat in front of you.  {!isAuthenticated && (
              <span className="block mt-2 text-sm text-blue-600">
                💡 <a href="/api/login" className="underline hover:text-blue-800">Create a free account</a> to save your bags for future trips!
              </span>
            )}
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <i className="fas fa-shield-alt text-verified-blue mr-2"></i>
              <span>Verified Airline Data</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-mobile-alt text-airline-blue mr-2"></i>
              <span>Mobile Optimized</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-clock text-success-green mr-2"></i>
              <span>Instant Results</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <BagCheckForm onAirlineSelect={setSelectedAirlineCode} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>

        {/* Airline Reference Table */}
        <div className="mt-12">
          <AirlineReference />
        </div>
      </main>
    </div>
  );
}
