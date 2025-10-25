"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Minimal declaration so TypeScript doesn't error when using process.env in client code.
declare const process: {
  env: {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  };
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

interface Instrument {
  id?: number | string;
  name?: string;
  [key: string]: any;
}

function App() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    const { data, error } = await supabase.from("instruments").select();
    if (error) {
      console.error("Error fetching instruments:", error);
      return;
    }
    setInstruments((data ?? []) as Instrument[]);
  }

  return (
    <ul>
      {instruments.map((instrument) => (
        <li key={(instrument.name ?? instrument.id) as string}>{instrument.name}</li>
      ))}
    </ul>
  );
}

export default App;
