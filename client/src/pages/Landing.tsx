import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-airline-blue">
                <i className="fas fa-plane mr-2"></i>BagFit
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/api/login"
                className="bg-airline-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                data-testid="button-login"
              >
                <i className="fas fa-user mr-1"></i>Login
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Will Your Bag Fit Under the Seat in Front of You?
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Check your bag dimensions against airline underseat space requirements. 
            Avoid surprises at the gate with verified airline data and save money on baggage fees.
          </p>
          
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-500 mb-8">
            <div className="flex items-center">
              <i className="fas fa-shield-alt text-verified-blue mr-2 text-lg"></i>
              <span>Verified Airline Data</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-mobile-alt text-airline-blue mr-2 text-lg"></i>
              <span>Mobile Optimized</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-clock text-success-green mr-2 text-lg"></i>
              <span>Instant Results</span>
            </div>
          </div>

          <a 
            href="/api/login"
            className="bg-airline-blue text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
            data-testid="button-get-started"
          >
            <i className="fas fa-rocket mr-2"></i>
            Get Started - It's Free
          </a>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-8 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-airline-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-airline-blue text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Bag Check</h3>
              <p className="text-gray-600">
                Enter your bag dimensions and get instant results for any airline. 
                Know before you go.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-8 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-verified-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-verified-blue text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Data</h3>
              <p className="text-gray-600">
                Our dimensions come from official airline sources. 
                Trust the data you're getting.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-8 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-success-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-wallet text-success-green text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Save Money</h3>
              <p className="text-gray-600">
                Avoid unexpected baggage fees by knowing your bag fits 
                as a personal item.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Preview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-airline-blue text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Airline</h3>
              <p className="text-gray-600">Choose your airline from our comprehensive database</p>
            </div>
            <div className="text-center">
              <div className="bg-airline-blue text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Dimensions</h3>
              <p className="text-gray-600">Input your bag's length, width, and height</p>
            </div>
            <div className="text-center">
              <div className="bg-airline-blue text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Results</h3>
              <p className="text-gray-600">Instantly see if your bag fits and save the result</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-airline-blue rounded-xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Travel Smarter?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of travelers who check their bags before heading to the airport.
          </p>
          <a 
            href="/api/login"
            className="bg-white text-airline-blue px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
            data-testid="button-join-now"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Join Now - Free Account
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">BagFit</h3>
              <p className="text-gray-600 mb-4">Making travel easier by helping you check if your bag fits airline requirements.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Tools</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-600 hover:text-airline-blue transition-colors">Bag Size Checker</Link></li>
                <li><span className="text-gray-400">My Bags (Login Required)</span></li>
                <li><span className="text-gray-400">Travel Tips</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2">
                <li><span className="text-gray-600">Help Center</span></li>
                <li><span className="text-gray-600">Contact Us</span></li>
                <li><span className="text-gray-600">Data Sources</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><span className="text-gray-600">Privacy Policy</span></li>
                <li><span className="text-gray-600">Terms of Service</span></li>
                <li><span className="text-gray-600">Disclaimer</span></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              © 2025 BagFit. All rights reserved. Always verify requirements with your airline before traveling.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
