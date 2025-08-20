import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import MyBags from "@/pages/MyBags";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/home">
        {isLoading ? <div>Loading...</div> : <Home />}
      </Route>
      <Route path="/welcome" component={Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/check-bag">
        {isLoading ? <div>Loading...</div> : <Home />}
      </Route>
      <Route path="/my-bags">
        {isAuthenticated ? <MyBags /> : <Landing />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
