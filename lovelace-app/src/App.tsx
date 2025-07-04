import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { supabase } from "./lib/supabase";
import Main from "./components/Main";
import Auth from "./components/Auth";
import Chat from "./components/Chat";

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
     <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Main /> : <Auth />}></Route>
        <Route path="/:id" element={session ? <Main /> : <Auth />}></Route>
      </Routes>
     </BrowserRouter>
    </div>
  )
}

export default App
